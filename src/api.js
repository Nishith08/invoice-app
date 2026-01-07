//const API_BASE = 'https://approvals.sigma.ac.in/backend/api';
//const API_BASE = 'http://localhost:8000/api';
const API_BASE = 'http://192.168.2.166:8000/api';
async function authFetch(url, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const opts = { ...options, headers };
  const res = await fetch(API_BASE + url, opts);
  if (!res.ok) throw new Error('API error');
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(API_BASE + '/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, password }) 
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('user_role', data.user.role);
  localStorage.setItem('user_department', data.user.department);
  return data.user;
}

export async function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_role');
}

export async function getInvoices(role) {
  // Backend filters invoices by role automatically
  return authFetch('/invoices');
}

export async function uploadInvoice(formData) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(API_BASE + '/invoices', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function actionInvoice(id, action, comment, poRequired, feedback, rejectedRole,) {
  //console.log("hiwl",poRequired);
  return authFetch(`/invoices/${id}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, comment, poRequired, feedback, rejectedRole }),
  });
}

export async function getInvoiceLogs(id) {
  return authFetch(`/invoices/${id}/logs`);
}
