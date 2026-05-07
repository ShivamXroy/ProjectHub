import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    API.get('/notifications')
      .then(r => setItems(r.data))
      .catch(() => {});
  }, []);

  const unread = items.filter(item => !item.read).length;

  const markAllRead = async () => {
    await API.put('/notifications/read-all');
    setItems(prev => prev.map(item => ({ ...item, read: true })));
  };

  return (
    <div style={{ position: 'fixed', top: 18, right: 24, zIndex: 220 }}>
      <button type="button" onClick={() => setOpen(!open)} className="btn btn-outline btn-sm" style={{ background: 'var(--bg2)' }}>
        Alerts {unread > 0 && <span className="badge badge-rejected">{unread}</span>}
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          marginTop: 8,
          width: 360,
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--bg2)',
          border: '1px solid var(--border2)',
          borderRadius: 10,
          boxShadow: 'var(--shadow)',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottom: '1px solid var(--border)' }}>
            <strong>Notifications</strong>
            <button type="button" onClick={markAllRead} className="btn btn-outline btn-sm">Mark read</button>
          </div>
          {items.length === 0 ? (
            <div style={{ padding: 18, color: 'var(--text3)', fontSize: 14 }}>No alerts right now.</div>
          ) : (
            <div style={{ maxHeight: 420, overflow: 'auto' }}>
              {items.map(item => (
                <Link key={item._id} to={item.link || '#'} onClick={() => setOpen(false)} style={{
                  display: 'block',
                  padding: 14,
                  borderBottom: '1px solid var(--border)',
                  background: item.read ? 'transparent' : 'var(--accent-glow)'
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.5 }}>{item.message}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
