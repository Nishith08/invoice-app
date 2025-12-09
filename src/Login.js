import React, { useState } from 'react';
import { login } from './api';
import './css/Login.css'; // Make sure to create this file

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      // Replace this with your actual login logic
      const user = await login(email, password);
      onLogin(user);
    } catch {
      setError('Invalid email or password');
    }
  }

  return (
    <div className="split-screen">
      <div className="split left">
        <div className="brand-box">
          <div className="brand-logo" aria-hidden="true">
            <img src="emblm.webp" className="brand-logo" alt="brand logo" aria-hidden="true" />
          </div>
          <h1>Welcome!</h1>
          <p>Manage Your invoices with ease.</p>
        </div>
      </div>
      <div className="split right">
          <div className="mobile-top-logo" aria-hidden="true">
          <div className="brand-logo small">
            <img src="emblm.webp" className="brand-logo small" alt="brand logo" aria-hidden="true" />
          </div>
        </div>
        <div className="login-container">
          <div className="mobile-brand" role="banner">
            <div className="brand-logo small" aria-hidden="true">
              <img src="emblm.webp" className="brand-logo small" alt="brand logo" aria-hidden="true" />
            </div>
            <div>
              <h2 className="mobile-welcome">Welcome!</h2>
              <div className="mobile-sub">Manage your invoices</div>
            </div>
          </div>
          <h2 className="login-title">Sign In</h2>
          {error && <div className="login-error">{error}</div>}
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-label">Email</label>
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
            <label className="login-label">Password</label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
            {/* <div className="login-row">
              <label className="remember">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                Remember me
              </label>
              <a href="#" className="forgot-link" onClick={e => e.preventDefault()}>Forgot password?</a>
            </div> */}
            <button type="submit" className="login-btn">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;