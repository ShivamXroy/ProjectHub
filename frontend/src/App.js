import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Notifications from './components/Notifications';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentProjects from './pages/student/StudentProjects';
import SubmitProject from './pages/student/SubmitProject';
import SubmitAssignment from './pages/student/SubmitAssignment';
import ResubmitProject from './pages/student/ResubmitProject';
import ProjectDetail from './pages/student/ProjectDetail';
import ProfessorDashboard from './pages/professor/ProfessorDashboard';
import ProfessorAssignments from './pages/professor/ProfessorAssignments';
import AssignmentReport from './pages/professor/AssignmentReport';
import ProfessorProjects from './pages/professor/ProfessorProjects';
import ReviewProject from './pages/professor/ReviewProject';
import Sidebar from './components/Sidebar';

function PrivateRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <Notifications />
      <div className="main-content">
        <Routes>
          {user.role === 'student' ? (
            <>
              <Route path="/" element={<StudentDashboard />} />
              <Route path="/assignments" element={<StudentAssignments />} />
              <Route path="/assignments/:id/submit" element={<SubmitAssignment />} />
              <Route path="/projects" element={<StudentProjects />} />
              <Route path="/submit" element={<SubmitProject />} />
              <Route path="/projects/:id/resubmit" element={<ResubmitProject />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            <>
              <Route path="/" element={<ProfessorDashboard />} />
              <Route path="/assignments" element={<ProfessorAssignments />} />
              <Route path="/assignments/:id/report" element={<AssignmentReport />} />
              <Route path="/projects" element={<ProfessorProjects />} />
              <Route path="/projects/:id/review" element={<ReviewProject />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
