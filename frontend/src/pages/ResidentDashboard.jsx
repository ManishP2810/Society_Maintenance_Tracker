import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import {
  FiLogOut,
  FiPlus,
  FiFileText,
  FiClock,
  FiAlertTriangle,
  FiCamera,
  FiX,
  FiCalendar,
  FiInfo,
  FiSun,
  FiMoon
} from 'react-icons/fi';

const ResidentDashboard = () => {
  const { user, logout } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');
  
  // Modals state
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Plumbing');
  const [formDescription, setFormDescription] = useState('');
  const [formPhoto, setFormPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const compRes = await api.get('/complaints/my');
      const noticeRes = await api.get('/notices');
      if (compRes.success) setComplaints(compRes.complaints);
      if (noticeRes.success) setNotices(noticeRes.notices);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormPhoto(null);
    setPhotoPreview(null);
  };

  const handleRaiseSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle || !formDescription || !formCategory) {
      setFormError('Please fill in all required fields');
      return;
    }

    setFormSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', formTitle);
      formData.append('category', formCategory);
      formData.append('description', formDescription);
      if (formPhoto) {
        formData.append('photo', formPhoto);
      }

      const res = await api.post('/complaints', formData);
      if (res.success) {
        // Reset and close
        setFormTitle('');
        setFormCategory('Plumbing');
        setFormDescription('');
        setFormPhoto(null);
        setPhotoPreview(null);
        setShowRaiseModal(false);
        fetchData();
      }
    } catch (error) {
      setFormError(error.message || 'Failed to submit complaint');
    }
    setFormSubmitting(false);
  };

  const openComplaintDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return <span className="badge badge-open">Open</span>;
      case 'In Progress':
        return <span className="badge badge-progress">In Progress</span>;
      case 'Resolved':
        return <span className="badge badge-resolved">Resolved</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Low':
        return <span className="badge badge-priority-low">Low</span>;
      case 'Medium':
        return <span className="badge badge-priority-medium">Medium</span>;
      case 'High':
        return <span className="badge badge-priority-high">High</span>;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="brand">
            <FiFileText size={24} />
            <span>Society Maintenance Tracker</span>
          </div>
          <div className="nav-links">
            <div className="nav-user">
              <span>Welcome, <strong>{user?.name}</strong> </span>
              <span className="nav-role">{user?.role}</span>
            </div>
            <button onClick={toggleTheme} className="theme-toggle" title="Toggle Theme">
              {theme === 'light' ? <FiMoon /> : <FiSun />}
            </button>
            <button onClick={logout} className="btn btn-secondary btn-icon" title="Logout">
              <FiLogOut />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {loading ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ animation: 'pulse 1.5s infinite' }}>⏳</div>
            <h2>Syncing dashboard...</h2>
          </div>
        ) : (
          <div className="dashboard-grid">
            
            {/* Complaints Column (Left) */}
            <div className="card" style={{ gridColumn: 'span 7' }}>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem' }}>My Support Tickets</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Raise and track maintenance concerns</p>
                </div>
                <button onClick={() => setShowRaiseModal(true)} className="btn btn-primary">
                  <FiPlus /> New Complaint
                </button>
              </div>

              {complaints.length === 0 ? (
                <div className="empty-state">
                  <FiFileText className="empty-state-icon" />
                  <h3>No complaints raised yet</h3>
                  <p>Raise a ticket and society administrators will help resolve it.</p>
                </div>
              ) : (
                <div className="complaint-list">
                  {complaints.map((c) => (
                    <div
                      key={c._id}
                      className={`complaint-item ${c.isOverdue ? 'overdue' : ''}`}
                      onClick={() => openComplaintDetails(c)}
                    >
                      <div className="complaint-header-row">
                        <div className="complaint-title">{c.title}</div>
                        <div className="complaint-badges-group">
                          {c.isOverdue && <span className="badge badge-overdue"><FiAlertTriangle /> Overdue</span>}
                          {getStatusBadge(c.status)}
                        </div>
                      </div>

                      <div className="complaint-meta">
                        <span className="complaint-category-label">{c.category}</span>
                        <span>•</span>
                        <span>Ticket #{c._id.toString().slice(-6).toUpperCase()}</span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FiCalendar /> {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="complaint-desc">{c.description}</div>

                      <div className="complaint-footer-row">
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Priority: {getPriorityBadge(c.priority)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>
                          View status history ({c.statusHistory?.length || 1} logs) →
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notice Board Column (Right) */}
            <div className="card" style={{ gridColumn: 'span 5' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Announcements Board</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Official notes from the administrator
              </p>

              {notices.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <FiInfo className="empty-state-icon" style={{ fontSize: '2rem' }} />
                  <h3>No notices posted</h3>
                  <p>General announcements will appear here.</p>
                </div>
              ) : (
                <div className="notice-board">
                  {notices.map((notice) => (
                    <div key={notice._id} className={`notice-card ${notice.isImportant ? 'pinned' : ''}`}>
                      {notice.isImportant && (
                        <div className="notice-pinned-badge">
                          📌 Pinned
                        </div>
                      )}
                      <div className="notice-header">
                        <h4 style={{ fontSize: '1rem', color: notice.isImportant ? 'var(--warning-dark)' : 'inherit' }}>
                          {notice.title}
                        </h4>
                      </div>
                      <div className="notice-meta">
                        <span>By {notice.authorId?.name || 'Admin'}</span>
                        <span>•</span>
                        <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="notice-body">{notice.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {/* Modal: Raise Complaint */}
      {showRaiseModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>File New Support Ticket</h3>
              <button onClick={() => setShowRaiseModal(false)} className="modal-close"><FiX /></button>
            </div>

            {formError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                <FiAlertTriangle />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRaiseSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Water leak in washroom"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-control"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Security">Security</option>
                  <option value="Cleanliness">Cleanliness</option>
                  <option value="Common Area">Common Area</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-control"
                  placeholder="Describe the issue in detail..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Attach Photo (Optional)</label>
                {photoPreview ? (
                  <div className="photo-preview-container">
                    <img src={photoPreview} alt="Preview" className="photo-preview-image" />
                    <button type="button" className="photo-preview-remove" onClick={handleRemovePhoto}>
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <div className="photo-preview-container" style={{ borderStyle: 'dashed' }}>
                    <label className="photo-upload-placeholder">
                      <FiCamera size={28} />
                      <span style={{ fontSize: '0.75rem' }}>Upload proof image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRaiseModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Submitting Ticket...' : 'File Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Complaint Details & Timeline */}
      {showDetailsModal && selectedComplaint && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <span className="complaint-category-label" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                  {selectedComplaint.category}
                </span>
                <h3 style={{ fontSize: '1.25rem' }}>{selectedComplaint.title}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Ticket ID: #{selectedComplaint._id.toUpperCase()}
                </p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="modal-close"><FiX /></button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Status</span>
                  {getStatusBadge(selectedComplaint.status)}
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Priority</span>
                  {getPriorityBadge(selectedComplaint.priority)}
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Raised On</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {new Date(selectedComplaint.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Details & Description
                </span>
                <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                  {selectedComplaint.description}
                </p>
              </div>

              {selectedComplaint.photoUrl && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                    Attached Photo
                  </span>
                  <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '300px' }}>
                    <img
                      src={`${api.baseUrl}${selectedComplaint.photoUrl}`}
                      alt="Complaint attachment"
                      style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '300px', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}

              {/* Status History Timeline */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
                  Status Lifecycle & History
                </span>
                <div className="timeline">
                  {selectedComplaint.statusHistory?.map((log, index) => {
                    const isLast = index === selectedComplaint.statusHistory.length - 1;
                    return (
                      <div key={log._id || index} className="timeline-item">
                        <div className={`timeline-marker ${log.status === 'Resolved' ? 'resolved' : isLast ? 'active' : ''}`} />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-actor">{log.actorName}</span>
                            <span className="timeline-time">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                            <strong>Status:</strong> {getStatusBadge(log.status)}
                          </div>
                          {log.note && (
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.8rem', borderLeft: '2px solid var(--primary)', paddingLeft: '0.5rem' }}>
                              {log.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <button onClick={() => setShowDetailsModal(false)} className="btn btn-secondary" style={{ width: '100%' }}>
              Close Ticket Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;
