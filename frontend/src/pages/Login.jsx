import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiMail, 
  FiLock, 
  FiAlertCircle, 
  FiUser, 
  FiShield, 
  FiFileText, 
  FiX, 
  FiInfo, 
  FiSettings, 
  FiCalendar 
} from 'react-icons/fi';

const Login = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Landing page / modal state
  const [showModal, setShowModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [intendedRole, setIntendedRole] = useState('resident'); // 'resident' | 'admin'

  // Form inputs state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('resident');

  // Submit states
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check URL parameters for register mode
  useEffect(() => {
    if (searchParams && searchParams.get('register') === 'true') {
      setAuthMode('register');
      setShowModal(true);
    }
  }, [searchParams]);

  // Sync regRole when intendedRole changes on registration tab selection
  useEffect(() => {
    setRegRole(intendedRole);
  }, [intendedRole]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      if (result.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/resident');
      }
    } else {
      setError(result.message || 'Invalid email or password');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!regName || !regEmail || !regPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);
    const result = await register(regName, regEmail, regPassword, regRole);
    setSubmitting(false);

    if (result.success) {
      if (result.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/resident');
      }
    } else {
      setError(result.message || 'Registration failed');
    }
  };

  const openAuthModal = (mode, role = 'resident') => {
    setError('');
    setAuthMode(mode);
    setIntendedRole(role);
    setShowModal(true);
  };

  return (
    <div className="landing-page">
      {/* Landing Header */}
      <header className="landing-nav">
        <div className="landing-brand">
          <FiFileText size={28} />
          <span>Society Management Tracker</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => openAuthModal('login')}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', fontWeight: '600' }}
          >
            Sign In
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => openAuthModal('register')}
            style={{ padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)' }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-badge">
          ✨ Premium Society Management
        </div>
        <h1 className="landing-title">
          Modern Society Living, Simplified.
        </h1>
        <p className="landing-subtitle">
          An all-in-one ecosystem for residents to report complaints, track issue lifecycles in real-time, and stay informed with community announcements.
        </p>
        <div className="landing-ctas">
          <button 
            className="btn btn-primary" 
            onClick={() => openAuthModal('login', 'resident')}
            style={{ padding: '0.85rem 1.75rem', borderRadius: 'var(--radius-full)' }}
          >
            Resident Portal
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => openAuthModal('login', 'admin')}
            style={{ 
              padding: '0.85rem 1.75rem', 
              borderRadius: 'var(--radius-full)', 
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            Administrator Entry
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="landing-features">
        <div className="landing-feature-card">
          <div className="landing-feature-icon">
            <FiFileText />
          </div>
          <h3 className="landing-feature-title">Effortless Support Tickets</h3>
          <p className="landing-feature-desc">
            File plumbing, electrical, security, or cleanliness complaints with ease. Attach photo proofs to help technicians resolve issues faster.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="landing-feature-icon">
            <FiCalendar />
          </div>
          <h3 className="landing-feature-title">Resolution History Logs</h3>
          <p className="landing-feature-desc">
            Track the exact history of your complaints with clear status tracking pipelines. Review admin notes and resolution logs at a glance.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="landing-feature-icon">
            <FiInfo />
          </div>
          <h3 className="landing-feature-title">Real-Time Announcement Board</h3>
          <p className="landing-feature-desc">
            Never miss an update from the administration. Keep up with pinned notices, water suspension advisories, and scheduling rules.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        © 2026 Society Maintenance Tracker. All rights reserved. Crafted for smart residential communities.
      </footer>

      {/* Auth Frosted Modal Overlay */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                  {authMode === 'login' ? 'Portal Log In' : 'Join Platform'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                  {authMode === 'login' 
                    ? `Enter credentials to access your ${intendedRole} desk` 
                    : `Register a new ${intendedRole} profile`}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <FiX />
              </button>
            </div>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                border: '1px solid rgba(239, 68, 68, 0.15)'
              }}>
                <FiAlertCircle />
                <span>{error}</span>
              </div>
            )}

            {/* Role Intended Selector (Tabs) */}
            <div className="login-tabs">
              <button
                type="button"
                className={`login-tab ${intendedRole === 'resident' ? 'active' : ''}`}
                onClick={() => {
                  setIntendedRole('resident');
                  setError('');
                }}
              >
                <FiUser /> Resident
              </button>
              <button
                type="button"
                className={`login-tab ${intendedRole === 'admin' ? 'active' : ''}`}
                onClick={() => {
                  setIntendedRole('admin');
                  setError('');
                }}
              >
                <FiShield /> Administrator
              </button>
            </div>

            {/* Flow Form */}
            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="form-group-icon-wrapper">
                    <FiMail />
                    <input
                      type="email"
                      className="form-control form-control-icon-padding"
                      placeholder="Enter your registered email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="form-group-icon-wrapper">
                    <FiLock />
                    <input
                      type="password"
                      className="form-control form-control-icon-padding"
                      placeholder="Enter security key"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
                  disabled={submitting}
                >
                  {submitting ? 'Authenticating...' : `Sign In as ${intendedRole === 'admin' ? 'Admin' : 'Resident'}`}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="form-group-icon-wrapper">
                    <FiUser />
                    <input
                      type="text"
                      className="form-control form-control-icon-padding"
                      placeholder="John Doe"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="form-group-icon-wrapper">
                    <FiMail />
                    <input
                      type="email"
                      className="form-control form-control-icon-padding"
                      placeholder="john@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="form-group-icon-wrapper">
                    <FiLock />
                    <input
                      type="password"
                      className="form-control form-control-icon-padding"
                      placeholder="At least 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
                  disabled={submitting}
                >
                  {submitting ? 'Creating Profile...' : `Register Profile`}
                </button>
              </form>
            )}

            {/* Toggle Mode */}
            <div className="auth-footer" style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
              {authMode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button 
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                    onClick={() => {
                      setAuthMode('register');
                      setError('');
                    }}
                  >
                    Register here
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button 
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                    onClick={() => {
                      setAuthMode('login');
                      setError('');
                    }}
                  >
                    Login here
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
