import React, { useEffect, useState } from 'react';

function InvoiceHistoryPage({ invoiceId, onBack }) {
  const [invNo, setInvNo] = useState("");
  const [invoices, setInvoices] = useState([]);

  // Global Logs Toggle
  const [showAllLogs, setShowAllLogs] = useState(true);

  // Modal states
  const [showDocModal, setShowDocModal] = useState(false);
  const [currentDocs, setCurrentDocs] = useState([]);

  useEffect(() => {
    fetch(`http://192.168.2.212:8000/api/logs/invoice/${invoiceId}`, {
      headers: { "Authorization": "Bearer " + localStorage.getItem("auth_token") }
    })
      .then(res => res.json())
      .then(data => {
        setInvNo(data.inv_no || "");
        setInvoices(data.invoices || []);
      });
  }, [invoiceId]);

  const openDocumentModal = (invoice) => {
    const docs = JSON.parse(invoice.document || "[]");
    setCurrentDocs(docs);
    setShowDocModal(true);
  };

  // Shared styles for better spacing and consistency
  const cardStyle = {
    border: '1px solid #e0e0e0',
    padding: 18,
    borderRadius: 10,
    overflowY: 'auto',
    marginBottom: 20,
    background: '#fff',
    boxShadow: '0 1px 4px rgba(10,10,10,0.06)'
  };

  const tableStyle = { width: '100%', marginBottom: 14, borderCollapse: 'separate', borderSpacing: '0 6px' };
  const cellStyle = { padding: '8px 10px', verticalAlign: 'top' };
  const actionTableStyle = { width: '100%', borderCollapse: 'collapse' };
  const primaryButtonStyle = { background: '#007bff', padding: '6px 12px', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' };
  const linkButtonStyle = { background: '#28a745', color: 'white', padding: '5px 10px', borderRadius: '6px', textDecoration: 'none' };

  return (
    <div className="container" style={{ position: "relative", padding: 16, overflowY: "auto", height: "100%" }}>

      {/* ========== HEADER ========== */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#085EE3',
          color: 'white',
          padding: '10px 16px',
          borderRadius: 8,
          marginBottom: 18,
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Simple SVG logo */}
          {/* <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 6 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#085EE3" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zM13 21h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
          </div> */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Invoice History</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>(INV No: {invNo})</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={onBack}
            aria-label="Back"
            style={{
              background: 'white',
              color: '#085EE3',
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>

          <button
            onClick={() => setShowAllLogs(!showAllLogs)}
            aria-pressed={showAllLogs}
            style={{
              background: showAllLogs ? '#063ea8' : '#ffffff',
              color: showAllLogs ? 'white' : '#085EE3',
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {showAllLogs ? 'Hide All Logs ▲' : 'Show All Logs ▼'}
          </button>
        </div>
      </header>

      {/* <hr style={{ marginTop: 0, marginBottom: 18 }} /> */}

      {invoices.length === 0 && <p>No invoices found.</p>}

      {invoices.map((invoice, index) => {

        const prev = index < invoices.length - 1 ? invoices[index + 1] : null;

        const changed = (field) =>
          prev && invoice[field] !== prev[field];

        return (
          <div key={invoice.id} style={cardStyle}>

            {/* ========== SUMMARY TABLE ========== */}
            <table style={tableStyle}>
              <tbody>

                <tr>
                  <td style={cellStyle}><b>Company:</b></td>
                  <td style={{ ...cellStyle, background: changed("title") ? "#ffe5a0" : "" }}>
                    {invoice.title}
                  </td>

                  <td style={cellStyle}><b>Department:</b></td>
                  <td style={cellStyle}>{invoice.department}</td>
                </tr>

                <tr>
                  <td style={cellStyle}><b>Status:</b></td>
                  <td style={cellStyle}>{invoice.status}</td>

                  <td style={cellStyle}><b>Invoice Type:</b></td>
                  <td style={{ ...cellStyle, background: changed("inv_type") ? "#ffe5a0" : "" }}>
                    {invoice.inv_type}
                  </td>
                </tr>

                <tr>
                  <td style={cellStyle}><b>Invoice No:</b></td>
                  <td style={{ ...cellStyle, background: changed("inv_no") ? "#ffe5a0" : "" }}>
                    {invoice.inv_no}
                  </td>

                  <td style={cellStyle}><b>Invoice Amount:</b></td>
                  <td style={{ ...cellStyle, background: changed("inv_amt") ? "#ffe5a0" : "" }}>
                    ₹ {invoice.inv_amt}
                  </td>
                </tr>

                <tr>
                  <td style={cellStyle}><b>Current Role:</b></td>
                  <td style={cellStyle}>{invoice.current_role}</td>

                  <td style={cellStyle}><b>Comment:</b></td>
                  <td style={{ ...cellStyle, background: changed("comment") ? "#ffe5a0" : "" }}>
                    {invoice.comment || "-"}
                  </td>
                </tr>

                {/* DOCUMENT BUTTON */}
                <tr>
                  <td style={cellStyle}><b>Document(s):</b></td>
                  <td colSpan="3" style={cellStyle}>
                    <button onClick={() => openDocumentModal(invoice)} style={primaryButtonStyle}>
                      📄 Show Documents
                    </button>
                  </td>
                </tr>

              </tbody>
            </table>

            {/* ========== ACTION HISTORY (Global Toggle) ========== */}
            {showAllLogs && (
              <div>
                <h4>Action History</h4>

                {invoice.logs.length === 0 && <p>No logs found.</p>}

                {invoice.logs.length > 0 && (
                  <table style={actionTableStyle}>
                    <thead>
                      <tr style={{ background: "#f6f6f6" }}>
                        <th style={{ ...cellStyle, textAlign: 'left' }}>Time</th>
                        <th style={{ ...cellStyle, textAlign: 'left' }}>User/Role</th>
                        <th style={{ ...cellStyle, textAlign: 'left' }}>Action</th>
                        <th style={{ ...cellStyle, textAlign: 'left' }}>Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.logs.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={cellStyle}>{new Date(log.created_at).toLocaleString()}</td>
                          <td style={cellStyle}>{log.user?.name || log.role}</td>
                          <td style={cellStyle}><b>{log.action.toUpperCase()}</b></td>
                          <td style={cellStyle}>{log.comment || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

          </div>
        );
      })}

      {/* =============== DOCUMENT POPUP MODAL =============== */}
      {showDocModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: "white",
              width: "500px",
              padding: "20px",
              borderRadius: "10px",
              maxHeight: "80vh",
              overflowY: "auto"
            }}
          >
            <h3>Documents</h3>
            <hr />

            {currentDocs.length === 0 ? (
              <p>No Documents</p>
            ) : (
              currentDocs.map((doc, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "12px",
                    gap: "10px"
                  }}
                >
                  <b>Doc {index + 1}</b>

                  {/* View */}
                  <a
                    href={`http://192.168.2.212:8000/storage/${doc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={primaryButtonStyle}
                  >
                    👁️ View
                  </a>

                  {/* Download */}
                  <a
                    href={`http://192.168.2.212:8000/api/download/${doc}`}
                    style={linkButtonStyle}
                  >
                    ⬇️ Download
                  </a>
                </div>
              ))
            )}

            <button
              onClick={() => setShowDocModal(false)}
              style={{
                marginTop: "10px",
                background: "red",
                color: "white",
                padding: "6px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                border: "none"
              }}
            >
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default InvoiceHistoryPage;
