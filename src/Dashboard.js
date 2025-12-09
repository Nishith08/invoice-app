import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getInvoices, uploadInvoice, actionInvoice } from "./api";
import FinalUploadModal from "./FinalUploadModal";
import "./css/Dashboard.css";
import InvoiceHistoryPage from "./InvoiceHistoryPage";

function Modal({ open, onClose, children, size }) {
  if (!open) return null;
  const maxW = size === "big" ? "920px" : "500px";
  return (
    <div className="modal-backdrop">
      <div
        className={`modal-content ${size === "big" ? "big-modal" : ""}`}
        style={{
          width: "95%",
          maxWidth: maxW,
          margin: "20px",
          padding: "24px",
          borderRadius: "12px",
          backgroundColor: "white",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          style={{
            position: "absolute",
            right: "16px",
            top: "16px",
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#6c757d",
            padding: "4px 8px",
            borderRadius: "4px",
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function ViewDocumentsModal({ open, onClose, documentField }) {
  if (!open || !documentField) return null;

  let documents = [];
  try {
    if (Array.isArray(documentField)) {
      documents = documentField;
    } else if (
      typeof documentField === "string" &&
      documentField.trim().startsWith("[")
    ) {
      documents = JSON.parse(documentField);
    } else if (typeof documentField === "string" && documentField !== "") {
      documents = [documentField];
    }
  } catch {
    documents = [documentField];
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h3 style={{ marginTop: 0, color: "#085EE3" }}>Documents</h3>

      {documents.length === 0 ? (
        <div>No documents found.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {documents.map((doc, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px",
                background: "#f8f9fa",
                borderRadius: "6px",
              }}
            >
              <b>Doc {idx + 1}</b>

              <div style={{ display: "flex", gap: "10px" }}>
                {/* VIEW */}
                <a
                  href={`http://192.168.2.212:8000/storage/${doc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#007bff",
                    padding: "6px 10px",
                    borderRadius: 5,
                    color: "white",
                    textDecoration: "none",
                  }}
                >
                  👁️ View
                </a>

                {/* DOWNLOAD */}
                <a
                  href={`http://192.168.2.212:8000/api/download/${doc}`}
                  download
                  style={{
                    background: "#28a745",
                    padding: "6px 10px",
                    borderRadius: 5,
                    color: "white",
                    textDecoration: "none",
                  }}
                >
                  ⬇️ Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function NotificationBell({ role, onViewInvoiceHistory }) {
  const [logs, setLogs] = useState([]);
  const [unseen, setUnseen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!role) return;
    fetch(
      `http://192.168.2.212:8000/api/logs/latest?role=${role}`,
      {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("auth_token"),
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setUnseen(data.unseen || false);
      });
  }, [role, showDropdown]);

  const markAsSeen = () => {
    fetch(
      `http://192.168.2.212:8000/api/logs/mark-seen?role=${role}`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("auth_token"),
        },
      }
    ).then(() => setUnseen(false));
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (showDropdown && !event.target.closest(".bell-container")) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const handleBellClick = () => {
    if (!showDropdown) {
      markAsSeen();
    }
    setShowDropdown(!showDropdown);
  };

  return (
    <div
      className="bell-container"
      style={{ position: "relative", cursor: "pointer", marginRight: 15 }}
      onClick={handleBellClick}
    >
      <span
        className="bell-icon"
        role="img"
        aria-label="notification"
        style={{ fontSize: "1.7rem" }}
      >
        🔔
        {unseen && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 10,
              height: 10,
              backgroundColor: "red",
              borderRadius: "50%",
              border: "2px solid white",
            }}
          />
        )}
      </span>
      {showDropdown && (
        <div
          className="notification-dropdown"
          style={{
            position: "absolute",
            right: 0,
            top: 30,
            background: "white",
            border: "1px solid #ccc",
            width: "min(420px, calc(100vw - 32px))",
            maxHeight: "340px",
            overflowY: "auto",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            borderRadius: 4,
            padding: 12,
            zIndex: 1001,
          }}
        >
          <b style={{ marginBottom: 8, display: "block" }}>Latest Actions</b>
          {logs.length === 0 ? (
            <div style={{ color: "#888", padding: 10 }}>No notifications</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={{ borderBottom: "1px solid #eee", padding: "6px 0" }}
              >
                <a
                  href="#"
                  style={{
                    color: "#085EE3",
                    fontWeight: 600,
                    textDecoration: "underline",
                    marginRight: 6,
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    onViewInvoiceHistory &&
                      onViewInvoiceHistory(log.invoice_id);
                  }}
                  title="View invoice history"
                >
                  {log.invoice?.title + " (" + log.invoice.department + ")" ||
                    "No title"}
                </a>
                <b>{log.role}</b> <em>{log.action.toUpperCase()}</em> :{" "}
                {log.comment || "(no comment)"}
                <div style={{ fontSize: "0.85em", color: "#666" }}>
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Dashboard({ role, department, onLogout }) {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [filters, setFilters] = useState({
    title: "",
    department: "",
    status: "",
    inv_type: "",
    inv_no: "",
    inv_amt: "",
    current_role: "",
    comment: "",
  });
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [showInvoiceHistory, setShowInvoiceHistory] = useState(false);
  const [historyInvoiceId, setHistoryInvoiceId] = useState(null);

  const [finalModalOpen, setFinalModalOpen] = useState(false);
  const [finalModalInvoiceId, setFinalModalInvoiceId] = useState(null);

  const [showActionModal, setShowActionModal] = useState(false);
  const [actionInvoiceId, setActionInvoiceId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionComment, setActionComment] = useState("");
  const [actionQuery, setActionQuery] = useState("");
  const [commentError, setCommentError] = useState(false);
  const [queryError, setQueryError] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inv_type, setInv_type] = useState("");
  const [inv_no, setInv_no] = useState("");
  const [inv_amt, setInv_amt] = useState("");

  const [showDocModal, setShowDocModal] = useState(false);
  const [docModalFiles, setDocModalFiles] = useState(null);

  const [kycRequired, setKycRequired] = useState("no");
  const [kycFiles, setKycFiles] = useState([]);

  // NEW: track if we are making corrections (editing an existing invoice)
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleError, setRoleError] = useState(false);

  useEffect(() => {
    async function showRejectNotifications() {
      if (!role) return;
      try {
        const res = await fetch(
          `http://192.168.2.212:8000/api/logs/latest?role=${role}`,
          {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("auth_token"),
            },
          }
        );

        const data = await res.json();
        if (data.logs && data.logs.length > 0) {
          data.logs.forEach((log) => {
            if (log.action === "reject" && log.seen === 0) {
              console.log(
                "Checking for rejection notifications for role:",
                role
              );
              const invoice = log.invoice;
              let rejectedTo = invoice?.rejectedTo_role;

              if (typeof rejectedTo === "string") {
                try {
                  rejectedTo = JSON.parse(rejectedTo);
                } catch {
                  rejectedTo = [];
                }
              }
              console.log("Parsed rejectedTo_role:", rejectedTo);
              if (Array.isArray(rejectedTo) && rejectedTo.includes(role)) {
                toast(
                  <div>
                    <strong>Invoice Rejected</strong>
                    <div>Reason: {log.query || log.comment || "-"}</div>
                    <div>Invoice: {invoice?.title || "No title"}</div>
                    <div>By: {log.user?.name || log.role}</div>
                  </div>,
                  { type: "error", position: "top-right", autoClose: 8000 }
                );
              }
            }
          });
        }
      } catch {}
    }
    showRejectNotifications();
  }, [role]);

  useEffect(() => {
    loadInvoices();
  }, [refresh]);

  useEffect(() => {
    const filtered = invoices.filter((invoice) => {
      return (
        String(invoice.title || "")
          .toLowerCase()
          .includes(filters.title.toLowerCase()) &&
        String(invoice.department || "")
          .toLowerCase()
          .includes(filters.department.toLowerCase()) &&
        String(invoice.status || "")
          .toLowerCase()
          .includes(filters.status.toLowerCase()) &&
        String(invoice.inv_type || "")
          .toLowerCase()
          .includes(filters.inv_type.toLowerCase()) &&
        String(invoice.inv_no || "")
          .toLowerCase()
          .includes(filters.inv_no.toLowerCase()) &&
        String(invoice.inv_amt || "")
          .toLowerCase()
          .includes(filters.inv_amt.toLowerCase()) &&
        String(invoice.current_role || "")
          .toLowerCase()
          .includes(filters.current_role.toLowerCase()) &&
        String(invoice.comment || "")
          .toLowerCase()
          .includes(filters.comment.toLowerCase())
      );
    });
    setFilteredInvoices(filtered);
  }, [filters, invoices]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  async function loadInvoices() {
    try {
      const data = await getInvoices(role);
      setInvoices(data);
    } catch {
      setError("Failed to load invoices");
    }
  }

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };
  const removeFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetCreateFormState = () => {
    setTitle("");
    setComment("");
    setInv_no("");
    setInv_amt("");
    setInv_type("");
    setSelectedFiles([]);
    setError("");

    setKycRequired("no");
    setKycFiles([]);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setEditingInvoice(null);
    resetCreateFormState();
  };

  async function handleUpload(e) {
    e.preventDefault();

    if (!selectedFiles.length || !title || !inv_no || !inv_amt || !inv_type) {
      setError("All fields and file are required");

      return;
    }

    if (kycRequired === "yes" && kycFiles.length === 0) {
      console.log("data24:");
      setError("Please upload KYC documents when KYC is required.");
      return;
    }

    setError("");
    const formData = new FormData();
    formData.append("title", title);
    formData.append("inv_no", inv_no);
    formData.append("inv_amt", inv_amt);
    formData.append("inv_type", inv_type);
    formData.append("comment", comment);
    formData.append("correction", editingInvoice ? "1" : "0");

    if (editingInvoice && editingInvoice.id) {
      formData.append("invoice_id", editingInvoice.id);
    }

    // Only on create invoice

    formData.append("kyc_required", kycRequired);
    if (kycRequired === "yes") {
      kycFiles.forEach((f) => formData.append("kyc_docs[]", f));
    }

    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("document[]", selectedFiles[i]);
    }

    try {
      await uploadInvoice(formData);
      resetCreateFormState();
      setEditingInvoice(null);
      setShowCreateModal(false);
      setRefresh(refresh + 1);
    } catch {
      setError("Upload failed");
    }
  }

  function handleAction(id, chosenAction) {
    setActionInvoiceId(id);
    setActionType(chosenAction);
    setActionComment("");
    setActionQuery("");
    setCommentError(false);
    setQueryError(false);
    setShowActionModal(true);
  }

  async function submitAction() {
    let valid = true;
    if (!actionComment) {
      setCommentError(true);
      valid = false;
    } else {
      setCommentError(false);
    }
    if (actionType !== "approve") {
      if (!actionQuery) {
        setQueryError(true);
        valid = false;
      } else {
        setQueryError(false);
      }
      if (!selectedRole) {
        setRoleError(true);
        valid = false;
      } else {
        setRoleError(false);
      }
    } else {
      setQueryError(false);
      setRoleError(false);
    }
    if (!valid) return;

    try {
      await actionInvoice(
        actionInvoiceId,
        actionType,
        actionComment,
        actionQuery,
        selectedRole
      );
      setShowActionModal(false);
      setActionInvoiceId(null);
      setActionType(null);
      setActionComment("");
      setActionQuery("");
      setSelectedRole("");
      setCommentError(false);
      setQueryError(false);
      setRefresh(refresh + 1);
    } catch {
      alert("Failed to submit action");
    }
  }

  async function handleFinalUpload(action, file, comment) {
    if (!file && action === "approve") {
      alert("File is required to approve the final document.");
      return;
    }

    const formData = new FormData();
    if (file) formData.append("final_doc", file);
    formData.append("comment", comment);
    formData.append("action", action);

    try {
      await fetch(
        `http://192.168.2.212:8000/api/invoices/${finalModalInvoiceId}/final-upload`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("auth_token"),
          },
          body: formData,
        }
      );
      setFinalModalOpen(false);
      setFinalModalInvoiceId(null);
      setRefresh(refresh + 1);
    } catch {
      alert("Failed to upload final document");
    }
  }

  const handleOpenCorrectionModal = (invoice) => {
    setEditingInvoice(invoice);
    setTitle(invoice.title || "");
    setInv_no(invoice.inv_no || "");
    setInv_amt(invoice.inv_amt || "");
    setInv_type(invoice.inv_type || "");
    setComment(invoice.comment || "");
    setSelectedFiles([]);
    setError("");
    setShowCreateModal(true);
  };

  if (showInvoiceHistory && historyInvoiceId) {
    return (
      <InvoiceHistoryPage
        invoiceId={historyInvoiceId}
        onBack={() => {
          setShowInvoiceHistory(false);
          setHistoryInvoiceId(null);
        }}
      />
    );
  }

  return (
    <div className="container dashboard-container">
      <header className="dashboard-header enhanced-dashboard-header">
        <div className="dashboard-logo-wrap">
          <img src="/hrzntl.webp" alt="Logo" className="dashboard-logo" />
        </div>
        <h2 className="dashboard-title">
          {role === "admin"
            ? "Admin Dashboard (" + department + ")"
            : `Dashboard - ${role}`}
        </h2>
        <div className="dashboard-header-actions">
          <div className="mobile-left">
            {role === "admin" && (
              <button
                className="dashboard-btn create-invoice-btn"
                onClick={() => {
                  setEditingInvoice(null);
                  resetCreateFormState();
                  setShowCreateModal(true);
                }}
              >
                Create Invoice
              </button>
            )}
          </div>

          <div className="mobile-right">
            <NotificationBell
              role={role}
              onViewInvoiceHistory={(id) => {
                setShowInvoiceHistory(true);
                setHistoryInvoiceId(id);
              }}
            />
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>
      {error && <div className="dashboard-error">{error}</div>}
      <Modal open={showCreateModal} onClose={handleCloseCreateModal} size={"big"}>
        <h3 style={{ marginTop: 0, marginBottom: "24px", color: "#4158d0" }}>
          {editingInvoice
            ? "Make Corrections (Update Invoice)"
            : "Create New Invoice"}
        </h3>
        <form
          className="dashboard-form modal-form"
          onSubmit={handleUpload}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div className="modal-row">
            <div className="modal-col">
              <label
                className="dashboard-label"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Company
              </label>
              <input
                className="dashboard-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Invoice Company"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              />
            </div>
            <div className="modal-col">
              <label
                className="dashboard-label"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Invoice NO.
              </label>
              <input
                className="dashboard-input"
                value={inv_no}
                onChange={(e) => setInv_no(e.target.value)}
                placeholder="Enter Invoice NO."
                readOnly={!!editingInvoice}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-col">
              <label
                className="dashboard-label"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Invoice Amount
              </label>
              <input
                className="dashboard-input"
                value={inv_amt}
                onChange={(e) => setInv_amt(e.target.value)}
                placeholder="Enter Invoice Amount"
                type="number"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              />
            </div>
            <div className="modal-col">
              <label
                className="dashboard-label"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Invoice Type
              </label>
              <select
                className="dashboard-input"
                value={inv_type}
                onChange={(e) => setInv_type(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  backgroundColor: "white",
                }}
              >
                <option value="">Select Invoice Type</option>
                <option value="PI">PI</option>
                <option value="TI">TI</option>
              </select>
            </div>
          </div>

          {/* KYC Required & KYC Docs  */}

          <div className="modal-row">
            <div className="modal-col">
            <label
              className="dashboard-label"
              style={{ display: "block", marginBottom: 8 }}
            >
              KYC Required?
            </label>

            <div style={{ display: "flex", gap: "20px", marginBottom: "8px" }}>
              <label>
                <input
                  type="radio"
                  value="yes"
                  checked={kycRequired === "yes"}
                  onChange={() => setKycRequired("yes")}
                />{" "}
                Yes
              </label>

              <label>
                <input
                  type="radio"
                  value="no"
                  checked={kycRequired === "no"}
                  onChange={() => setKycRequired("no")}
                />{" "}
                No
              </label>
            </div>
            </div>

            {kycRequired === "yes" && (
              <div className="modal-col">
                <label
                  className="dashboard-label"
                  style={{ display: "block", marginBottom: 8 }}
                >
                  Upload KYC Documents
                </label>

                <input
                  type="file"
                  className="dashboard-input"
                  multiple
                  onChange={(e) => setKycFiles(Array.from(e.target.files))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                  }}
                />

                {kycFiles.length > 0 && (
                  <ul style={{ marginTop: 6 }}>
                    {kycFiles.map((file, idx) => (
                      <li key={idx}>{file.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="modal-row">
            <div className="modal-col">
            <label
              className="dashboard-label"
              style={{ display: "block", marginBottom: "8px" }}
            >
              Comment
            </label>
            <textarea
              className="dashboard-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comment"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid " + "#ddd",
                fontSize: "14px",
                minHeight: "80px",
                resize: "vertical",
              }}
            />
          </div>
          <div className="modal-col">
            <label
              className="dashboard-label"
              style={{ display: "block", marginBottom: "8px" }}
            >
              File (PDF/Image)
            </label>
            <input
              className="dashboard-input"
              type="file"
              accept=".pdf,image/*"
              multiple
              onChange={handleFileChange}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                fontSize: "14px",
              }}
            />
            <div style={{ marginTop: 8 }}>
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#f7f7f7",
                    marginBottom: 4,
                    padding: "6px 12px",
                    borderRadius: 4,
                  }}
                >
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#d9534f",
                      fontSize: 16,
                      cursor: "pointer",
                      marginLeft: 10,
                    }}
                    title="Remove file"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          </div>
          </div>
          <button
            type="submit"
            className="dashboard-btn"
            style={{
              marginTop: "8px",
              padding: "10px",
              backgroundColor: "#4158d0",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            {editingInvoice ? "Save Corrections" : "Upload"}
          </button>
        </form>
      </Modal>

      <FinalUploadModal
        open={finalModalOpen}
        onClose={() => {
          setFinalModalOpen(false);
          setFinalModalInvoiceId(null);
        }}
        onSubmit={handleFinalUpload}
      />

      <Modal open={showActionModal} onClose={() => setShowActionModal(false)}>
        <div style={{ maxWidth: 520, minWidth: 260 }}>
          <h3 style={{ marginTop: 0, color: "#085EE3" }}>
            {actionType
              ? `${
                  actionType.charAt(0).toUpperCase() + actionType.slice(1)
                } Invoice`
              : "Confirm Action"}
          </h3>
          <label style={{ display: "block", marginTop: 8 }}>Comment</label>
          <textarea
            value={actionComment}
            onChange={(e) => {
              setActionComment(e.target.value);
              setCommentError(false);
            }}
            style={{
              width: "100%",
              minHeight: 80,
              padding: 8,
              border: commentError ? "2px solid red" : undefined,
            }}
            placeholder="Add comment"
            required
          />
          {commentError && (
            <div style={{ color: "red", fontSize: 13, marginTop: 2 }}>
              Comment is required
            </div>
          )}
          {actionType !== "approve" && (
            <>
              <label style={{ display: "block", marginTop: 8 }}>Query</label>
              <input
                value={actionQuery}
                onChange={(e) => {
                  setActionQuery(e.target.value);
                  setQueryError(false);
                }}
                style={{
                  width: "100%",
                  padding: 8,
                  border: queryError ? "2px solid red" : undefined,
                }}
                placeholder="Enter Your Query"
                required
              />
              {queryError && (
                <div style={{ color: "red", fontSize: 13, marginTop: 2 }}>
                  Query is required
                </div>
              )}
              <label style={{ display: "block", marginTop: 10 }}>
                Select Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setRoleError(false);
                }}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: roleError ? "2px solid red" : "1px solid #ccc",
                }}
              >
                <option value="">-- Select Role --</option>
                <option value="admin">Admin</option>
                <option value="accounts_1st">Accounts 1st</option>
                <option value="accounts_2nd">Accounts 2nd</option>
                <option value="accounts_3rd">Accounts 3rd</option>
              </select>
              {roleError && (
                <div style={{ color: "red", fontSize: 13, marginTop: 2 }}>
                  Role selection is required
                </div>
              )}
            </>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 12,
            }}
          >
            <button
              type="button"
              className="dashboard-btn"
              onClick={() => setShowActionModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dashboard-btn dashboard-approve-btn"
              onClick={submitAction}
            >
              Submit
            </button>
          </div>
        </div>
      </Modal>

      <ViewDocumentsModal
        open={showDocModal}
        onClose={() => {
          setShowDocModal(false);
          setDocModalFiles(null);
        }}
        documentField={docModalFiles}
      />

      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Sr No.</th>
              <th style={{ textAlign: "center" }}>Actions</th>
              <th>Company</th>
              <th>Department</th>
              <th>Status</th>
              <th>Invoice Type</th>
              <th>Invoice No.</th>
              <th>Invoice Amount</th>
              <th>KYC Required</th>
              <th>KYC Docs</th>
              <th>Current Role</th>
              <th style={{ textAlign: "center" }}>Document</th>
              <th>Comment</th>
            </tr>
            <tr>
              <th></th>
              <th></th>
              <th>
                <input
                  type="text"
                  placeholder="Filter Company"
                  value={filters.title}
                  onChange={(e) => handleFilterChange("title", e.target.value)}
                  className="filter-input"
                />
              </th>
              <th>
                <input
                  type="text"
                  placeholder="Filter Department"
                  value={filters.department}
                  onChange={(e) =>
                    handleFilterChange("department", e.target.value)
                  }
                  className="filter-input"
                />
              </th>
              <th>
                <input
                  type="text"
                  placeholder="Filter Status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="filter-input"
                />
              </th>
              <th>
                <input
                  type="text"
                  placeholder="Filter Type"
                  value={filters.inv_type}
                  onChange={(e) =>
                    handleFilterChange("inv_type", e.target.value)
                  }
                  className="filter-input"
                />
              </th>
              <th>
                <input
                  type="text"
                  placeholder="Filter No."
                  value={filters.inv_no}
                  onChange={(e) => handleFilterChange("inv_no", e.target.value)}
                  className="filter-input"
                />
              </th>
              <th>
                <input
                  type="text"
                  placeholder="Filter Amount"
                  value={filters.inv_amt}
                  onChange={(e) =>
                    handleFilterChange("inv_amt", e.target.value)
                  }
                  className="filter-input"
                />
              </th>
              {/* No filters for KYC for now */}

              <th></th>
              <th></th>
              <th>
                <input
                  type="text"
                  placeholder="Filter Role"
                  value={filters.current_role}
                  onChange={(e) =>
                    handleFilterChange("current_role", e.target.value)
                  }
                  className="filter-input"
                />
              </th>
              <th></th>
              <th>
                <input
                  type="text"
                  placeholder="Filter Comment"
                  value={filters.comment}
                  onChange={(e) =>
                    handleFilterChange("comment", e.target.value)
                  }
                  className="filter-input"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="14">No invoices found</td>
              </tr>
            ) : (
              filteredInvoices.map(
                (
                  {
                    id,
                    title,
                    department,
                    status,
                    inv_type,
                    inv_no,
                    inv_amt,
                    kyc_required,
                    kyc_docs,
                    current_role,
                    comment,
                    document,
                  },
                  i
                ) => (
                  <tr key={id}>
                    <td>{i + 1}</td>
                    <td style={{ textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <button
                          className="dashboard-btn dashboard-history-btn"
                          onClick={() => {
                            setShowInvoiceHistory(true);
                            setHistoryInvoiceId(id);
                          }}
                          title="View History"
                          style={{
                            padding: "6px",
                            minWidth: "auto",
                            width: "32px",
                            height: "32px",
                          }}
                        >
                          <i
                            className="fas fa-history"
                            style={{ color: "white", fontSize: "0.9rem" }}
                          ></i>
                        </button>
                        {role === "final_accountant" &&
                          status === "completed" && (
                            <button
                              className="dashboard-btn dashboard-final-btn"
                              onClick={() => {
                                setFinalModalInvoiceId(id);
                                setFinalModalOpen(true);
                              }}
                              title="Upload Final Document"
                              style={{
                                padding: "6px",
                                minWidth: "auto",
                                width: "32px",
                                height: "32px",
                              }}
                            >
                              <i
                                className="fas fa-upload"
                                style={{ color: "white", fontSize: "0.9rem" }}
                              ></i>
                            </button>
                          )}
                        {role !== "admin" && status !== "completed" && (
                          <>
                            <button
                              className="dashboard-btn dashboard-approve-btn"
                              onClick={() => handleAction(id, "approve")}
                              title="Approve Invoice"
                              style={{
                                padding: "6px",
                                minWidth: "auto",
                                width: "32px",
                                height: "32px",
                              }}
                            >
                              <i
                                className="fas fa-check"
                                style={{ color: "white", fontSize: "0.9rem" }}
                              ></i>
                            </button>
                            <button
                              className="dashboard-btn dashboard-reject-btn"
                              onClick={() => handleAction(id, "reject")}
                              title="Reject Invoice"
                              style={{
                                padding: "6px",
                                minWidth: "auto",
                                width: "32px",
                                height: "32px",
                              }}
                            >
                              <i
                                className="fas fa-times"
                                style={{ color: "white", fontSize: "0.9rem" }}
                              ></i>
                            </button>
                          </>
                        )}
                        {role === "admin" && status === "rejected" && (
                          <button
                            className="dashboard-btn dashboard-correction-btn"
                            onClick={() =>
                              handleOpenCorrectionModal({
                                id,
                                title,
                                department,
                                status,
                                inv_type,
                                inv_no,
                                inv_amt,
                                current_role,
                                comment,
                              })
                            }
                            title="Make Corrections"
                            style={{
                              padding: "6px",
                              minWidth: "auto",
                              width: "32px",
                              height: "32px",
                              backgroundColor: "#dc3545",
                            }}
                          >
                            <i
                              className="fa fa-pen"
                              style={{ color: "white", fontSize: "0.9rem" }}
                            ></i>
                          </button>
                        )}
                      </div>
                    </td>
                    <td>{title}</td>
                    <td>{department}</td>
                    <td>{status}</td>
                    <td>{inv_type}</td>
                    <td>{inv_no}</td>
                    <td>{inv_amt}</td>
                    <td>
                      {kyc_required
                        ? kyc_required === "yes"
                          ? "Yes"
                          : "No"
                        : "-"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="dashboard-btn dashboard-view-btn"
                        title="View KYC Docs"
                        style={{
                          padding: "6px",
                          minWidth: "auto",
                          width: "32px",
                          height: "32px",
                          background: "#17a2b8",
                        }}
                        onClick={() => {
                          setDocModalFiles(kyc_docs);
                          setShowDocModal(true);
                        }}
                      >
                        <i
                          className="fas fa-id-card"
                          style={{ color: "white", fontSize: "0.9rem" }}
                        ></i>
                      </button>
                    </td>

                    <td>{current_role}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="dashboard-btn dashboard-view-btn"
                        title="View Documents"
                        style={{
                          padding: "6px",
                          minWidth: "auto",
                          width: "32px",
                          height: "32px",
                        }}
                        onClick={() => {
                          setDocModalFiles(document);
                          setShowDocModal(true);
                        }}
                      >
                        <i
                          className="fas fa-file-alt"
                          style={{ color: "white", fontSize: "0.9rem" }}
                        ></i>
                      </button>
                    </td>
                    <td>{comment}</td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
