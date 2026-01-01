import React, { useEffect, useState } from 'react';

function NotificationBell({ role, onViewInvoiceHistory }) {
  const [logs, setLogs] = useState([]);
  const [unseen, setUnseen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!role) return;
    fetch(`http://10.160.208.67:8000/api/logs/latest?role=${role}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
    })
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        setUnseen(data.unseen || false);
      });
  }, [role, showDropdown]);

  const markAsSeen = () => {
    fetch(`http://10.160.208.67:8000/api/logs/mark-seen?role=${role}`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
    }).then(() => setUnseen(false));
  };

  return (
    <div className="bell-container"
      tabIndex={0}
      onMouseEnter={() => {setShowDropdown(true); markAsSeen();}}
      onMouseLeave={() => setShowDropdown(false)}
      style={{ position: 'relative', cursor: 'pointer'}}
    >
      <span className="bell-icon" style={{ fontSize: "1.7rem" }}>🔔{unseen && <span className="bell-dot"></span>}</span>
      {showDropdown && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 30,
          background: 'white',
          border: '1px solid #ccc',
          width: '420px',
          maxHeight: '380px',
          overflowY: 'auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          borderRadius: 4,
          padding: 12,
          zIndex: 1001
        }}>
          <b style={{marginBottom: 8, display: 'block'}}>Latest Actions</b>
          {logs.length === 0
            ? <div style={{color:"#888", padding:10}}>No notifications</div>
            : logs.map((log) => (
              <div key={log.id} style={{borderBottom:'1px solid #eee',padding:'6px 0'}}>
                <a
                  href="#"
                  style={{ color: '#085EE3', fontWeight: 600, textDecoration: 'underline', marginRight: 6 }}
                  onClick={(e) => { e.preventDefault(); onViewInvoiceHistory(log.invoice_id); }}
                  title="View invoice history"
                >
                  {log.invoice?.title || "No title"}
                </a>
                <b>{log.role}</b> <em>{log.action.toUpperCase()}</em> : {log.comment || '(no comment)'}
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
