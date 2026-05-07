const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const Assignment = require('../models/Assignment');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect, professorOnly, studentOnly } = require('../middleware/auth');

const normalize = (value) => String(value || '').trim().toLowerCase();

const professorHandlesSubject = (professor, subject) => {
  if (!subject) return true;
  return (professor.subjectSpecializations || []).some(item => normalize(item) === normalize(subject));
};

const canProfessorAccessProject = (project, professor) => {
  const student = project.student;
  const sameDepartment = normalize(student?.department) && normalize(student.department) === normalize(professor.department);
  if (!sameDepartment) return false;

  if (project.assignedProfessor) {
    const assignedId = project.assignedProfessor._id || project.assignedProfessor;
    return assignedId.toString() === professor._id.toString();
  }

  return professorHandlesSubject(professor, project.subject);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
const projectUpload = upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'sourceCode', maxCount: 1 }
]);

const getUploadedFile = (req, field) => req.files?.[field]?.[0]?.filename || '';

const ensureProjectAccess = (project, user) => {
  if (user.role === 'student') return project.student._id.toString() === user._id.toString();
  if (user.role === 'professor') return canProfessorAccessProject(project, user);
  return false;
};

const textTypes = new Set(['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.py', '.java', '.c', '.cpp', '.md', '.txt', '.env', '.yml', '.yaml', '.xml']);

const readZipEntries = async (filePath) => {
  const buffer = await fs.promises.readFile(filePath);
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error('Invalid ZIP file');

  const centralDirSize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = [];
  let offset = centralDirOffset;

  while (offset < centralDirOffset + centralDirSize) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.slice(offset + 46, offset + 46 + fileNameLength).toString('utf8');
    entries.push({ name, compression, compressedSize, uncompressedSize, localHeaderOffset, directory: name.endsWith('/') });
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return { buffer, entries };
};

const readZipEntryContent = (zip, entry) => {
  const localOffset = entry.localHeaderOffset;
  if (zip.buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('Invalid ZIP entry');
  const nameLength = zip.buffer.readUInt16LE(localOffset + 26);
  const extraLength = zip.buffer.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + nameLength + extraLength;
  const compressed = zip.buffer.slice(dataStart, dataStart + entry.compressedSize);
  if (entry.compression === 0) return compressed;
  if (entry.compression === 8) return zlib.inflateRawSync(compressed);
  throw new Error('Unsupported ZIP compression method');
};

router.post('/', protect, studentOnly, projectUpload, async (req, res) => {
  try {
    const { title, description, assignment, techStack, githubLink, deployedLink } = req.body;
    let { subject, assignedProfessor } = req.body;
    let assignmentDoc = null;

    if (assignment) {
      assignmentDoc = await Assignment.findById(assignment).populate('professor', 'name email department subjectSpecializations');
      if (!assignmentDoc) return res.status(400).json({ message: 'Assignment not found' });
      if (normalize(assignmentDoc.department) !== normalize(req.user.department)) {
        return res.status(403).json({ message: 'This assignment is not for your department' });
      }
      if (assignmentDoc.section && normalize(assignmentDoc.section) !== normalize(req.user.section)) {
        return res.status(403).json({ message: 'This assignment is not for your section' });
      }
      if (normalize(assignmentDoc.semester) !== normalize(req.user.semester)) {
        return res.status(403).json({ message: 'This assignment is not for your semester' });
      }
      if (new Date() > assignmentDoc.deadline) {
        return res.status(403).json({ message: 'The deadline for this assignment has passed' });
      }
      const existing = await Project.findOne({ assignment: assignmentDoc._id, student: req.user._id });
      if (existing) return res.status(400).json({ message: 'You already submitted this assignment' });
      subject = assignmentDoc.subject;
      assignedProfessor = assignmentDoc.professor._id;
    }

    if (!subject) return res.status(400).json({ message: 'Subject is required' });
    if (!assignedProfessor) return res.status(400).json({ message: 'Please select a professor for this subject' });

    const professor = await User.findOne({ _id: assignedProfessor, role: 'professor' });
    if (!professor) return res.status(400).json({ message: 'Selected professor not found' });
    if (normalize(professor.department) !== normalize(req.user.department)) {
      return res.status(403).json({ message: 'You can submit only to professors in your department' });
    }
    if (!professorHandlesSubject(professor, subject)) {
      return res.status(403).json({ message: 'Selected professor is not assigned to this subject' });
    }

    const project = await Project.create({
      title,
      description,
      subject,
      techStack: techStack ? JSON.parse(techStack) : [],
      githubLink,
      deployedLink,
      documentFile: getUploadedFile(req, 'document'),
      sourceCodeFile: getUploadedFile(req, 'sourceCode'),
      assignment: assignmentDoc?._id || null,
      student: req.user._id,
      assignedProfessor,
      status: 'under_review'
    });
    await project.populate('student', 'name email rollNumber department section semester');
    await project.populate('assignedProfessor', 'name email department subjectSpecializations');
    await project.populate('assignment', 'title subject department section semester deadline');
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') query.student = req.user._id;
    let projects = await Project.find(query)
      .populate('student', 'name email rollNumber department section semester')
      .populate('assignedProfessor', 'name email department subjectSpecializations')
      .populate('assignment', 'title subject department section semester deadline')
      .sort({ submittedAt: -1 });

    if (req.user.role === 'professor') {
      projects = projects.filter(project => canProfessorAccessProject(project, req.user));
    }

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('student', 'name email rollNumber department section semester')
      .populate('assignedProfessor', 'name email department subjectSpecializations')
      .populate('assignment', 'title subject department section semester deadline');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.user.role === 'student' && project.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }
    if (req.user.role === 'professor' && !canProfessorAccessProject(project, req.user)) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/source', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('student', 'name email rollNumber department section semester')
      .populate('assignedProfessor', 'name email department subjectSpecializations');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!ensureProjectAccess(project, req.user)) {
      return res.status(403).json({ message: 'Not authorized to view source code' });
    }
    if (!project.sourceCodeFile) return res.status(404).json({ message: 'No source code file uploaded' });

    const filePath = path.join(__dirname, '..', 'uploads', project.sourceCodeFile);
    const ext = path.extname(project.sourceCodeFile).toLowerCase();
    if (!textTypes.has(ext)) {
      return res.status(400).json({
        message: 'Preview is available for text/code files only. Download the archive to inspect it.',
        downloadUrl: `/uploads/${project.sourceCodeFile}`
      });
    }

    const content = await fs.promises.readFile(filePath, 'utf8');
    res.json({ filename: project.sourceCodeFile, content });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/source/tree', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('student', 'name email rollNumber department section semester')
      .populate('assignedProfessor', 'name email department subjectSpecializations');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!ensureProjectAccess(project, req.user)) return res.status(403).json({ message: 'Not authorized to view source code' });
    if (!project.sourceCodeFile) return res.status(404).json({ message: 'No source code file uploaded' });

    const filePath = path.join(__dirname, '..', 'uploads', project.sourceCodeFile);
    if (path.extname(project.sourceCodeFile).toLowerCase() !== '.zip') {
      return res.status(400).json({ message: 'Source file is not a ZIP archive' });
    }

    const zip = await readZipEntries(filePath);
    res.json({
      filename: project.sourceCodeFile,
      entries: zip.entries
        .filter(entry => !entry.directory)
        .map(entry => ({
          name: entry.name,
          size: entry.uncompressedSize,
          previewable: textTypes.has(path.extname(entry.name).toLowerCase())
        }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/source/file', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('student', 'name email rollNumber department section semester')
      .populate('assignedProfessor', 'name email department subjectSpecializations');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!ensureProjectAccess(project, req.user)) return res.status(403).json({ message: 'Not authorized to view source code' });

    const filePath = path.join(__dirname, '..', 'uploads', project.sourceCodeFile);
    const requested = String(req.query.path || '');
    if (!requested || requested.includes('..')) return res.status(400).json({ message: 'Invalid file path' });
    const zip = await readZipEntries(filePath);
    const entry = zip.entries.find(item => item.name === requested && !item.directory);
    if (!entry) return res.status(404).json({ message: 'File not found in ZIP' });
    if (!textTypes.has(path.extname(entry.name).toLowerCase())) {
      return res.status(400).json({ message: 'This file type cannot be previewed' });
    }
    if (entry.uncompressedSize > 512 * 1024) {
      return res.status(400).json({ message: 'File is too large to preview' });
    }

    const content = readZipEntryContent(zip, entry).toString('utf8');
    res.json({ filename: entry.name, content });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/resubmit', protect, studentOnly, projectUpload, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.student.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not your project' });
    if (project.status !== 'revision_needed') return res.status(400).json({ message: 'Resubmission is available only when revision is requested' });

    const documentFile = getUploadedFile(req, 'document');
    const sourceCodeFile = getUploadedFile(req, 'sourceCode');
    project.revisionHistory.push({
      description: project.description,
      documentFile: project.documentFile,
      sourceCodeFile: project.sourceCodeFile,
      submittedAt: project.updatedAt || project.submittedAt
    });
    project.title = req.body.title || project.title;
    project.description = req.body.description || project.description;
    project.techStack = req.body.techStack ? JSON.parse(req.body.techStack) : project.techStack;
    project.githubLink = req.body.githubLink ?? project.githubLink;
    project.deployedLink = req.body.deployedLink ?? project.deployedLink;
    if (documentFile) project.documentFile = documentFile;
    if (sourceCodeFile) project.sourceCodeFile = sourceCodeFile;
    project.status = 'under_review';

    await project.save();
    await project.populate('student', 'name email rollNumber department section semester');
    await project.populate('assignedProfessor', 'name email department subjectSpecializations');
    await project.populate('assignment', 'title subject department section semester deadline');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, studentOnly, projectUpload, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your project' });
    }

    const { title, description, subject, assignedProfessor, techStack, githubLink, deployedLink } = req.body;

    if (subject || assignedProfessor) {
      const nextSubject = subject || project.subject;
      const nextProfessorId = assignedProfessor || project.assignedProfessor;
      const professor = await User.findOne({ _id: nextProfessorId, role: 'professor' });
      if (!professor) return res.status(400).json({ message: 'Selected professor not found' });
      if (normalize(professor.department) !== normalize(req.user.department)) {
        return res.status(403).json({ message: 'You can submit only to professors in your department' });
      }
      if (!professorHandlesSubject(professor, nextSubject)) {
        return res.status(403).json({ message: 'Selected professor is not assigned to this subject' });
      }
      project.subject = nextSubject;
      project.assignedProfessor = professor._id;
    }

    project.title = title || project.title;
    project.description = description || project.description;
    project.techStack = techStack ? JSON.parse(techStack) : project.techStack;
    project.githubLink = githubLink ?? project.githubLink;
    project.deployedLink = deployedLink ?? project.deployedLink;
    const documentFile = getUploadedFile(req, 'document');
    const sourceCodeFile = getUploadedFile(req, 'sourceCode');
    if (documentFile) project.documentFile = documentFile;
    if (sourceCodeFile) project.sourceCodeFile = sourceCodeFile;
    project.status = project.assignedProfessor ? 'under_review' : 'pending';

    await project.save();
    await project.populate('student', 'name email rollNumber department section semester');
    await project.populate('assignedProfessor', 'name email department subjectSpecializations');
    await project.populate('assignment', 'title subject department section semester deadline');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, studentOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your project' });
    }
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/assign', protect, professorOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('student', 'name email rollNumber department section semester');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canProfessorAccessProject(project, req.user)) {
      return res.status(403).json({ message: 'This project is not assigned to your department and subject' });
    }

    project.assignedProfessor = req.user._id;
    project.status = 'under_review';
    await project.save();
    await project.populate('assignedProfessor', 'name email department subjectSpecializations');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
