import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getInvoices, uploadInvoice, actionInvoice } from './api';
import FinalUploadModal from './FinalUploadModal';
import axios from 'axios';
import './css/Dashboard.css';

// Simple modal component for form
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
}

// InvoiceHistoryPage component
function InvoiceHistoryPage({ invoiceId, onBack }) {
  const [history, setHistory] = useState([]);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/logs/invoice/${invoiceId}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
    })
      .then(res => res.json())
      .then(data => {
        setInvoice(data.invoice || null);
        setHistory(data.logs || []);
      });
  }, [invoiceId]);

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: 14 }}>← Back</button>
      <h2 style={{ color: '#085EE3' }}>{invoice ? `Invoice: ${invoice.title}` : 'Invoice History'}</h2>
      <h4>Department: {invoice?.department || "-"}</h4>
      <h4>Status: {invoice?.status || "-"}</h4>
      <h4>Current Role: {invoice?.current_role || "-"}</h4>
      {invoice?.final_document && (
        <div style={{ margin: '14px 0' }}>
          <a href={`http://localhost:8000/storage/${invoice.final_document}`} target="_blank" rel="noopener noreferrer" style={{ color: '#28A745', fontWeight: 600 }}>
            View Final Document
          </a>
        </div>
      )}
      <hr />
      <h3>Action History</h3>
      {history.length === 0 ? "No history found." :
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Time</th>
              <th>User/Role</th>
              <th>Action</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {history.map(entry =>
              <tr key={entry.id}>
                <td>{new Date(entry.created_at).toLocaleString()}</td>
                <td>{entry.user?.name || entry.role}</td>
                <td><b>{entry.action.toUpperCase()}</b></td>
                <td>{entry.comment || '-'}</td>
              </tr>
            )}
          </tbody>
        </table>
      }
    </div>
  );
}

// NotificationBell component (unchanged)
function NotificationBell({ role, onViewInvoiceHistory }) {
  const [logs, setLogs] = useState([]);
  const [unseen, setUnseen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  useEffect(() => {
    if (!role) return;
    fetch(`http://localhost:8000/api/logs/latest?role=${role}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
    })
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        setUnseen(data.unseen || false);
      });
  }, [role, showDropdown]);

  const markAsSeen = () => {
    fetch(`http://localhost:8000/api/logs/mark-seen?role=${role}`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
    }).then(() => setUnseen(false));
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (showDropdown && !event.target.closest('.bell-container')) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleBellClick = () => {
    if (!showDropdown) {
      markAsSeen();
    }
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="bell-container"
      style={{ position: 'relative', cursor: 'pointer', marginRight: 15 }}
      onClick={handleBellClick}
    >
      <span className="bell-icon" role="img" aria-label="notification" style={{ fontSize: '1.7rem' }}>
        🔔
        {unseen && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 10,
            height: 10,
            backgroundColor: 'red',
            borderRadius: '50%',
            border: '2px solid white'
          }} />
        )}
      </span>
      {showDropdown && (
        <div className="notification-dropdown" style={{
          position: 'absolute',
          right: 0,
          top: 30,
          background: 'white',
          border: '1px solid #ccc',
          width: 'min(420px, calc(100vw - 32px))',
          maxHeight: '340px',
          overflowY: 'auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          borderRadius: 4,
          padding: 12,
          zIndex: 1001,
        }}>
          <b style={{ marginBottom: 8, display: 'block' }}>Latest Actions</b>
          {logs.length === 0 ? (
            <div style={{ color: "#888", padding: 10 }}>No notifications</div>
          ) : logs.map(log => (
            <div key={log.id} style={{ borderBottom: '1px solid #eee', padding: '6px 0' }}>
              <a
                href="#"
                style={{ color: '#085EE3', fontWeight: 600, textDecoration: 'underline', marginRight: 6 }}
                onClick={e => { e.preventDefault(); onViewInvoiceHistory && onViewInvoiceHistory(log.invoice_id); }}
                title="View invoice history"
              >
                {log.invoice?.title +' ('+ log.invoice.department + ')' || "No title"}
              </a>
              <b>{log.role }</b> <em>{log.action.toUpperCase()}</em> : {log.comment || '(no comment)'}
              <div style={{ fontSize: '0.85em', color: '#666' }}>
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// Main Dashboard Component
function Dashboard({ role, department, onLogout }) {
  const [invoices, setInvoices] = useState([]);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  // For invoice history and final upload modals
  const [showInvoiceHistory, setShowInvoiceHistory] = useState(false);
  const [historyInvoiceId, setHistoryInvoiceId] = useState(null);

  const [finalModalOpen, setFinalModalOpen] = useState(false);
  const [finalModalInvoiceId, setFinalModalInvoiceId] = useState(null);

  // Action modal (replace native prompt with a 2-field modal)
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionInvoiceId, setActionInvoiceId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionComment, setActionComment] = useState('');
  const [actionQuery, setActionQuery] = useState('');
  const [commentError, setCommentError] = useState(false);
  const [queryError, setQueryError] = useState(false);

  // Modal state for create invoice form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inv_type, setInv_type] = useState('');
  const [inv_no, setInv_no] = useState('');
  const [inv_amt, setInv_amt] = useState('');

  function getBackUserRole(actorRole) {
    switch (actorRole) {
      case 'accounts_1st': return 'admin';
      case 'accounts_2nd': return 'accounts_1st';
      case 'accounts_3rd': return 'accounts_2nd';
      case 'final_accountant': return 'accounts_3rd';
      default: return null;
    }
  }

  // Toast reject notifications on load/login for unseen reject actions for current user role
  useEffect(() => {
    async function showRejectNotifications() {
      if (!role) return;
      try {
        const res = await fetch(`http://localhost:8000/api/logs/latest?role=${role}`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
        });
        const data = await res.json();
        if (data.logs && data.logs.length > 0) {
          data.logs.forEach(log => {
            if (
              log.action === 'reject'  && log.seen === 0 &&
              getBackUserRole(log.role) === role &&        
              log.role !== role                                
            ) {
              toast(
                <div>
                  <strong>Invoice Rejected</strong>
                  <div>Reason: {log.query || log.comment || '-'}</div>
                  <div>Invoice: {log.invoice?.title || 'No title'}</div>
                  <div>By: {log.user?.name || log.role}</div>
                </div>,
                { type: "error", position: "top-right", autoClose: 8000 }
              );
            }
          });
        }
      } catch {
        // optionally handle errors quietly
      }
    }
    showRejectNotifications();
  }, [role]);

  useEffect(() => {
    loadInvoices();
  }, [refresh]);

  async function loadInvoices() {
    try {
      const data = await getInvoices(role);
      setInvoices(data);
    } catch {
      setError('Failed to load invoices');
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file || !title || !inv_no || !inv_amt || !inv_type) {
      setError('All fields and file are required');
      return;
    }
    setError('');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('inv_no', inv_no);
    formData.append('inv_amt', inv_amt);
    formData.append('inv_type', inv_type);
    formData.append('comment', comment);
    formData.append('document', file);

    try {
      await uploadInvoice(formData);
      setTitle('');
      setComment('');
      setFile(null);
      setInv_no('');
      setInv_amt('');
      setInv_type('');
      setShowCreateModal(false); // close modal on success
      setRefresh(refresh + 1);
    } catch {
      setError('Upload failed');
    }
  }

  // Open the action modal (replaces the native prompt)
  function handleAction(id, chosenAction) {
    setActionInvoiceId(id);
    setActionType(chosenAction);
    setActionComment('');
    setActionQuery('');
    setCommentError(false);
    setQueryError(false);
    setShowActionModal(true);
  }

  // Submit action from the modal WITH VALIDATION
  async function submitAction() {
    let valid = true;
    if (!actionComment) {
      setCommentError(true);
      valid = false;
    } else {
      setCommentError(false);
    }
    if (actionType !== 'approve') {
      if (!actionQuery) {
        setQueryError(true);
        valid = false;
      } else {
        setQueryError(false);
      }
    } else {
      setQueryError(false);
    }
    if (!valid) return;

    try {
      await actionInvoice(actionInvoiceId, actionType, actionComment, actionQuery);
      setShowActionModal(false);
      setActionInvoiceId(null);
      setActionType(null);
      setActionComment('');
      setActionQuery('');
      setCommentError(false);
      setQueryError(false);
      setRefresh(refresh + 1);
    } catch {
      alert('Failed to submit action');
    }
  }

  // Handle final accountant modal submission
  async function handleFinalUpload(action, file, comment) {
    if (!file && action === 'approve') {
      alert('File is required to approve the final document.');
      return;
    }

    const formData = new FormData();
    if (file) formData.append('final_doc', file);
    formData.append('comment', comment);
    formData.append('action', action);

    try {
      await fetch(`http://localhost:8000/api/invoices/${finalModalInvoiceId}/final-upload`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') },
        body: formData
      });
      setFinalModalOpen(false);
      setFinalModalInvoiceId(null);
      setRefresh(refresh + 1);
    } catch {
      alert('Failed to upload final document');
    }
  }

  if (showInvoiceHistory && historyInvoiceId) {
    return (
      <InvoiceHistoryPage
        invoiceId={historyInvoiceId}
        onBack={() => { setShowInvoiceHistory(false); setHistoryInvoiceId(null); }}
      />
    );
  }

  return (
    <div className="container dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          {role === 'admin' ? 'Admin Dashboard ('+ department +')'  : `Dashboard — ${role}`}
        </h2>
        
        <div style={{display: "flex"}}>
          <NotificationBell role={role} onViewInvoiceHistory={id => { setShowInvoiceHistory(true); setHistoryInvoiceId(id); }} />
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

          {role === 'admin' && (
            <div className="dashboard-create-wrap">
              <button className="dashboard-btn" onClick={() => setShowCreateModal(true)}>
                Create Invoice
              </button>
            </div>
          )}
          <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)}>
            <form className="dashboard-form modal-form" onSubmit={handleUpload}>
          <label className="dashboard-label">Company</label>
          <input className="dashboard-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Invoice Company" />
          <label className="dashboard-label">Invoice NO.</label>
          <input className="dashboard-input" value={inv_no} onChange={e => setInv_no(e.target.value)} placeholder="Enter Invoice NO." />
          <label className="dashboard-label">Invoice Amount</label>
          <input className="dashboard-input" value={inv_amt} onChange={e => setInv_amt(e.target.value)} placeholder="Enter Invoice Amount" type="number" />
          <label className="dashboard-label">Invoice Type</label>
          <select className="dashboard-input" value={inv_type} onChange={e => setInv_type(e.target.value)}>
            <option value="">Select Invoice Type</option>
            <option value="PI">PI</option>
            <option value="TI">TI</option>
          </select>
          <label className="dashboard-label">Comment</label>
          <textarea className="dashboard-input" value={comment} onChange={e => setComment(e.target.value)} placeholder="Comment" />
          <label className="dashboard-label">File (PDF/Image)</label>
          <input className="dashboard-input" type="file" accept=".pdf,image/*" onChange={e => setFile(e.target.files[0])} />
          <button type="submit" className="dashboard-btn">Upload</button>
        </form>
      </Modal>

      <FinalUploadModal
        open={finalModalOpen}
        onClose={() => { setFinalModalOpen(false); setFinalModalInvoiceId(null); }}
        onSubmit={handleFinalUpload}
      />

      <Modal open={showActionModal} onClose={() => setShowActionModal(false)}>
        <div style={{ maxWidth: 520, minWidth: 260 }}>
          <h3 style={{ marginTop: 0, color: '#085EE3' }}>{actionType ? `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Invoice` : 'Confirm Action'}</h3>
          <label style={{ display: 'block', marginTop: 8 }}>Comment</label>
          <textarea
            value={actionComment}
            onChange={e => {
              setActionComment(e.target.value);
              setCommentError(false);
            }}
            style={{
              width: '100%',
              minHeight: 80,
              padding: 8,
              border: commentError ? '2px solid red' : undefined
            }}
            placeholder="Add comment"
            required
          />
          {commentError && (
            <div style={{ color: 'red', fontSize: 13, marginTop: 2 }}>Comment is required</div>
          )}
          {actionType !== 'approve' && (
            <>
              <label style={{ display: 'block', marginTop: 8 }}>Query</label>
              <input
                value={actionQuery}
                onChange={e => {
                  setActionQuery(e.target.value);
                  setQueryError(false);
                }}
                style={{
                  width: '100%',
                  padding: 8,
                  border: queryError ? '2px solid red' : undefined
                }}
                placeholder="Enter Your Query"
                required
              />
              {queryError && (
                <div style={{ color: 'red', fontSize: 13, marginTop: 2 }}>Query is required</div>
              )}
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="dashboard-btn" onClick={() => setShowActionModal(false)}>Cancel</button>
            <button type="button" className="dashboard-btn dashboard-approve-btn" onClick={submitAction}>Submit</button>
          </div>
        </div>
      </Modal>

      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Sr No.</th>
              <th>Company</th>
              <th>Department</th>
              <th>Status</th>
              <th>Invoice Type</th>
              <th>Invoice No.</th>
              <th>Invoice Amount</th>
              <th>Current Role</th>
              <th style={{ textAlign: 'center' }}>Document</th>
              <th>Comment</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan="7">No invoices found</td></tr>
            ) : invoices.map(({ id, title, department, status, inv_type, inv_no, inv_amt, current_role, comment, document_url }, i) => (
              <tr key={id}>
                <td>{i + 1}</td>
                <td>{title}</td>
                <td>{department}</td>
                <td>{status}</td>
                <td>{inv_type}</td>
                <td>{inv_no}</td>
                <td>{inv_amt}</td>
                <td>{current_role}</td>
                <td style={{ textAlign: 'center' }}>
                  <a href={`http://localhost:8000${document_url}`} target="_blank" rel="noopener noreferrer">
                    <button 
                      className="dashboard-btn dashboard-view-btn" 
                      title="View Document"
                      style={{ padding: '6px', minWidth: 'auto', width: '32px', height: '32px' }}
                    >
                      <i className="fas fa-file-alt" style={{ color: 'white', fontSize: '0.9rem' }}></i>
                    </button>
                  </a>
                </td>
                <td>{role === 'admin' ? comment : null}</td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                    <button
                      className="dashboard-btn dashboard-history-btn"
                      onClick={() => {
                        setShowInvoiceHistory(true);
                        setHistoryInvoiceId(id);
                      }}
                      title="View History"
                      style={{ padding: '6px', minWidth: 'auto', width: '32px', height: '32px' }}
                    >
                      <i className="fas fa-history" style={{ color: 'white', fontSize: '0.9rem' }}></i>
                    </button>
                    {role === 'final_accountant' && status === 'completed' && (
                      <button
                        className="dashboard-btn dashboard-final-btn"
                        onClick={() => {
                          setFinalModalInvoiceId(id);
                          setFinalModalOpen(true);
                        }}
                        title="Upload Final Document"
                        style={{ padding: '6px', minWidth: 'auto', width: '32px', height: '32px' }}
                      >
                        <i className="fas fa-upload" style={{ color: 'white', fontSize: '0.9rem' }}></i>
                      </button>
                    )}
                    {role !== 'admin' && current_role === role && status !== 'completed' && (
                      <>
                        <button 
                          className="dashboard-btn dashboard-approve-btn" 
                          onClick={() => handleAction(id, 'approve')}
                          title="Approve Invoice"
                          style={{ padding: '6px', minWidth: 'auto', width: '32px', height: '32px' }}
                        >
                          <i className="fas fa-check" style={{ color: 'white', fontSize: '0.9rem' }}></i>
                        </button>
                        <button 
                          className="dashboard-btn dashboard-reject-btn" 
                          onClick={() => handleAction(id, 'reject')}
                          title="Reject Invoice"
                          style={{ padding: '6px', minWidth: 'auto', width: '32px', height: '32px' }}
                        >
                          <i className="fas fa-times" style={{ color: 'white', fontSize: '0.9rem' }}></i>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
