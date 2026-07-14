import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import {
  FiLogOut,
  FiFileText,
  FiCalendar,
  FiAlertTriangle,
  FiX,
  FiCheckCircle,
  FiSettings,
  FiInbox,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiSun,
  FiMoon,
  FiZap,
  FiLayout,
  FiTool,
  FiShield
} from 'react-icons/fi';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [complaints, setComplaints] = useState([]);
  
  const getCategoryIcon = (category) => {
    const iconStyle = "category-icon-wrapper";
    switch (category) {
      case 'Plumbing':
        return <div className={`${iconStyle} cat-plumbing`} title="Plumbing"><FiTool /></div>;
      case 'Electrical':
        return <div className={`${iconStyle} cat-electrical`} title="Electrical"><FiZap /></div>;
      case 'Security':
        return <div className={`${iconStyle} cat-security`} title="Security"><FiShield /></div>;
      case 'Cleanliness':
        return <div className={`${iconStyle} cat-cleanliness`} title="Cleanliness"><FiTrash2 /></div>;
      case 'Common Area':
        return <div className={`${iconStyle} cat-common`} title="Common Area"><FiLayout /></div>;
      default:
        return <div className={`${iconStyle} cat-others`} title="Others"><FiSettings /></div>;
    }
  };
  const [notices, setNotices] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: { Open: 0, 'In Progress': 0, Resolved: 0 }, overdueCount: 0 });
  const [settings, setSettings] = useState({ overdueThresholdDays: 3 });
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');

  // Filters state
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterOverdue, setFilterOverdue] = useState(false);

  // Settings form
  const [thresholdInput, setThresholdInput] = useState(3);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Notices form
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeImportant, setNoticeImportant] = useState(false);
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);

  // Admin action modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('Open');
  const [updatePriority, setUpdatePriority] = useState('Medium');
  const [updateNote, setUpdateNote] = useState('');
  const [updateSubmitting, setUpdateSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get Settings
      const settingsRes = await api.get('/settings');
      if (settingsRes.success) {
        setSettings(settingsRes.settings);
        setThresholdInput(settingsRes.settings.overdueThresholdDays);
      }

      // 2. Get Stats
      const statsRes = await api.get('/dashboard/stats');
      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      // 3. Get Notices
      const noticesRes = await api.get('/notices');
      if (noticesRes.success) {
        setNotices(noticesRes.notices);
      }

      // 4. Get complaints with filter parameters (overdue value dynamically calculated backend)
      await fetchComplaints();
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
    setLoading(false);
  };

  const fetchComplaints = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterCategory) queryParams.append('category', filterCategory);
      if (filterStatus) queryParams.append('status', filterStatus);
      if (filterPriority) queryParams.append('priority', filterPriority);
      if (filterDate) queryParams.append('date', filterDate);
      if (filterOverdue) queryParams.append('overdue', 'true');

      const res = await api.get(`/complaints?${queryParams.toString()}`);
      if (res.success) {
        setComplaints(res.complaints);
      }
    } catch (error) {
      console.error('Error fetching complaints list:', error);
    }
  };

  // Re-run complaints fetch when filters change
  useEffect(() => {
    fetchComplaints();
  }, [filterCategory, filterStatus, filterPriority, filterDate, filterOverdue]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Save config threshold
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await api.put('/settings', { overdueThresholdDays: thresholdInput });
      if (res.success) {
        setSettings(res.settings);
        // Refresh data because overdue thresholds are computed dynamically based on this config!
        await fetchData();
      }
    } catch (error) {
      alert(error.message || 'Failed to update threshold');
    }
    setSettingsSaving(false);
  };

  // Publish notice
  const handlePublishNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;

    setNoticeSubmitting(true);
    try {
      const res = await api.post('/notices', {
        title: noticeTitle,
        content: noticeContent,
        isImportant: noticeImportant,
      });

      if (res.success) {
        setNoticeTitle('');
        setNoticeContent('');
        setNoticeImportant(false);
        // Refresh notices
        const noticesRes = await api.get('/notices');
        if (noticesRes.success) setNotices(noticesRes.notices);
      }
    } catch (error) {
      alert(error.message || 'Failed to post notice');
    }
    setNoticeSubmitting(false);
  };

  // Delete notice
  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const res = await api.delete(`/notices/${id}`);
      if (res.success) {
        setNotices(notices.filter((n) => n._id !== id));
      }
    } catch (error) {
      alert(error.message || 'Failed to delete notice');
    }
  };

  const openAdminAction = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateStatus(complaint.status);
    setUpdatePriority(complaint.priority);
    setUpdateNote('');
    setShowActionModal(true);
  };

  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    setUpdateSubmitting(true);
    try {
      // 1. Status Update
      const statusRes = await api.put(`/complaints/${selectedComplaint._id}/status`, {
        status: updateStatus,
        note: updateNote,
      });

      // 2. Priority Update
      const priorityRes = await api.put(`/complaints/${selectedComplaint._id}/priority`, {
        priority: updatePriority,
      });

      if (statusRes.success && priorityRes.success) {
        setShowActionModal(false);
        // Refresh data
        await fetchData();
      }
    } catch (error) {
      alert(error.message || 'Failed to update complaint');
    }
    setUpdateSubmitting(false);
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

  // Perform client-side filter on search text
  const filteredComplaints = complaints.filter(
    (c) =>
      c.title.toLowerCase().includes(filterSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(filterSearch.toLowerCase()) ||
      (c.residentId?.name && c.residentId.name.toLowerCase().includes(filterSearch.toLowerCase()))
  );

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
              <span>Admin, <strong>{user?.name}</strong> </span>
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
          <div>
            <div className="stats-container">
              <div className="skeleton-card" style={{ height: '110px' }}></div>
              <div className="skeleton-card" style={{ height: '110px' }}></div>
              <div className="skeleton-card" style={{ height: '110px' }}></div>
              <div className="skeleton-card" style={{ height: '110px' }}></div>
            </div>
            <div className="dashboard-grid">
              <div className="card col-span-8">
                <div className="skeleton skeleton-title" style={{ width: '40%', marginBottom: '1.5rem' }}></div>
                <div className="filter-bar">
                  <div className="skeleton" style={{ flex: 1, height: '38px', borderRadius: 'var(--radius-md)' }}></div>
                </div>
                <div className="skeleton-card" style={{ height: '100px' }}></div>
                <div className="skeleton-card" style={{ height: '100px' }}></div>
              </div>
              <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="card">
                  <div className="skeleton skeleton-title"></div>
                  <div className="skeleton skeleton-text"></div>
                  <div className="skeleton skeleton-text"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Dashboard Overview Cards */}
            <div className="stats-container">
              <div className="stat-card">
                <span className="stat-label">Total Tickets</span>
                <span className="stat-value">{stats.total}</span>
                <span className="stat-badge badge badge-priority-low">All categories</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Pending Review</span>
                <span className="stat-value">{stats.byStatus.Open}</span>
                <span className="stat-badge badge badge-open">Open status</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">In Progress</span>
                <span className="stat-value">{stats.byStatus['In Progress']}</span>
                <span className="stat-badge badge badge-progress">Active review</span>
              </div>
              <div className="stat-card" style={{ borderColor: stats.overdueCount > 0 ? 'var(--danger)' : 'var(--border-color)' }}>
                <span className="stat-label">Overdue Tickets</span>
                <span className="stat-value" style={{ color: stats.overdueCount > 0 ? 'var(--danger)' : 'inherit' }}>
                  {stats.overdueCount}
                </span>
                <span className="stat-badge badge badge-overdue">{stats.overdueThresholdDays} day rule</span>
              </div>
              <div className="stat-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="stat-label">Resolution Rate</span>
                  <span className="stat-value">{stats.total > 0 ? Math.round((stats.byStatus.Resolved / stats.total) * 100) : 0}%</span>
                  <span className="stat-badge badge badge-resolved">Resolved: {stats.byStatus.Resolved}</span>
                </div>
                <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                  <svg width="64" height="64" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border-color)" strokeWidth="12" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="transparent" 
                      stroke="var(--success)" 
                      strokeWidth="12" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (251.2 * (stats.total > 0 ? (stats.byStatus.Resolved / stats.total) * 100 : 0)) / 100} 
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                    />
                  </svg>
                  <div style={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)', 
                    fontFamily: 'var(--font-display)', 
                    fontWeight: '800', 
                    fontSize: '0.8rem'
                  }}>
                    {stats.byStatus.Resolved}
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              {/* Left Column: Complaints Admin Workspace */}
              <div className="card col-span-8">
                <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Maintenance Workspace</h2>

                {/* Filter and Search Bar */}
                <div className="filter-bar">
                  <div className="filter-item" style={{ flex: '2 1 200px' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Search Tickets</label>
                    <div className="form-group-icon-wrapper">
                      <FiSearch />
                      <input
                        type="text"
                        className="form-control form-control-icon-padding"
                        placeholder="Search title, details, resident..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="filter-item" style={{ flex: '1 1 120px' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Category</label>
                    <select className="form-control" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                      <option value="">All Categories</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Security">Security</option>
                      <option value="Cleanliness">Cleanliness</option>
                      <option value="Common Area">Common Area</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="filter-item" style={{ flex: '1 1 120px' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Status</label>
                    <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value="">All Statuses</option>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div className="filter-item" style={{ flex: '1 1 120px' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Priority</label>
                    <select className="form-control" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                      <option value="">All Priorities</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div className="filter-item" style={{ flex: '1 1 120px' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Created After</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </div>

                  <div className="filter-item" style={{ flex: '0 1 auto', alignSelf: 'flex-end', paddingBottom: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={filterOverdue}
                        onChange={(e) => setFilterOverdue(e.target.checked)}
                      />
                      <span style={{ color: 'var(--danger)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FiAlertTriangle /> Overdue Only
                      </span>
                    </label>
                  </div>
                </div>

                {/* Complaint List Workspace */}
                {filteredComplaints.length === 0 ? (
                  <div className="empty-state">
                    <FiInbox className="empty-state-icon" />
                    <h3>No tickets found matching filters</h3>
                    <p>Try resetting the search terms or categories.</p>
                  </div>
                ) : (
                  <div className="complaint-list">
                    {filteredComplaints.map((c) => (
                      <div
                        key={c._id}
                        className={`complaint-item ${c.isOverdue ? 'overdue' : ''}`}
                        onClick={() => openAdminAction(c)}
                        style={{ display: 'flex', flexDirection: 'row', gap: '1.25rem', alignItems: 'flex-start' }}
                      >
                        {getCategoryIcon(c.category)}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="complaint-header-row">
                            <div className="complaint-title">{c.title}</div>
                            <div className="complaint-badges-group">
                              {c.isOverdue && <span className="badge badge-overdue"><FiAlertTriangle /> Overdue</span>}
                              {getPriorityBadge(c.priority)}
                              {getStatusBadge(c.status)}
                            </div>
                          </div>

                          <div className="complaint-meta">
                            <span className="complaint-category-label">{c.category}</span>
                            <span>•</span>
                            <span>Resident: <strong>{c.residentId?.name || 'Resident'}</strong> ({c.residentId?.email || 'N/A'})</span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <FiCalendar /> {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="complaint-desc">{c.description}</div>

                          <div className="complaint-footer-row">
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Ticket ID: #{c._id.toString().toUpperCase()}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>
                              Manage ticket & history ({c.statusHistory?.length || 1} logs) →
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Notices Manager & Configuration Settings */}
              <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Section: Publish Notice */}
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Post New Notice</h3>
                  <form onSubmit={handlePublishNotice}>
                    <div className="form-group">
                      <label className="form-label">Notice Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Lift under maintenance"
                        value={noticeTitle}
                        onChange={(e) => setNoticeTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Notice Content</label>
                      <textarea
                        className="form-control"
                        placeholder="Provide announcement details..."
                        value={noticeContent}
                        onChange={(e) => setNoticeContent(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input
                          type="checkbox"
                          checked={noticeImportant}
                          onChange={(e) => setNoticeImportant(e.target.checked)}
                        />
                        <span>Mark as Important (Pins & emails residents)</span>
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      disabled={noticeSubmitting}
                    >
                      {noticeSubmitting ? 'Posting Notice...' : 'Publish Announcement'}
                    </button>
                  </form>
                </div>

                {/* Section: Configuration panel */}
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiSettings /> Overdue Settings
                  </h3>
                  <form onSubmit={handleSaveSettings}>
                    <div className="form-group">
                      <label className="form-label">Overdue Threshold (Days)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={thresholdInput}
                        onChange={(e) => setThresholdInput(Math.max(0, parseInt(e.target.value) || 0))}
                        required
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                        Tickets open longer than this will automatically be flagged overdue.
                      </span>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-secondary"
                      style={{ width: '100%' }}
                      disabled={settingsSaving}
                    >
                      {settingsSaving ? 'Saving...' : 'Update Settings'}
                    </button>
                  </form>
                </div>

                {/* Section: Manage Notices List */}
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Active Announcements</h3>
                  {notices.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>No notices posted</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {notices.map((n) => (
                        <div
                          key={n._id}
                          style={{
                            padding: '0.75rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: n.isImportant ? 'rgba(245, 158, 11, 0.02)' : 'transparent',
                            borderColor: n.isImportant ? 'var(--warning)' : 'var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '0.5rem'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {n.title}
                            </h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {new Date(n.createdAt).toLocaleDateString()} {n.isImportant ? '• 📌 Pinned' : ''}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteNotice(n._id)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                            title="Delete Announcement"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

            </div>
          </div>
        </div>
      )}
      </main>

      {/* Modal: Admin Edit & Update drawer */}
      {showActionModal && selectedComplaint && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '650px' }}>
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
              <button onClick={() => setShowActionModal(false)} className="modal-close"><FiX /></button>
            </div>

            <form onSubmit={handleUpdateComplaint}>
              <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
                
                {/* Meta details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Resident</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                      {selectedComplaint.residentId?.name || 'Resident'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      {selectedComplaint.residentId?.email || 'No email'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Submitted On</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                      {new Date(selectedComplaint.createdAt).toLocaleString()}
                    </span>
                    {selectedComplaint.isOverdue && (
                      <span className="badge badge-overdue" style={{ marginTop: '0.25rem' }}>
                        <FiAlertTriangle /> Overdue Ticket
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Resident Description</label>
                  <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                    {selectedComplaint.description}
                  </p>
                </div>

                {selectedComplaint.photoUrl && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Attached Photo</label>
                    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '250px' }}>
                      <img
                        src={`${api.baseUrl}${selectedComplaint.photoUrl}`}
                        alt="Support Attachment"
                        style={{ width: '100%', height: 'auto', maxHeight: '250px', objectFit: 'contain', display: 'block' }}
                      />
                    </div>
                  </div>
                )}

                {/* Edit Section */}
                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Update Ticket Settings</h4>
                  
                  <div className="form-row" style={{ marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Set Priority</label>
                      <select
                        className="form-control"
                        value={updatePriority}
                        onChange={(e) => setUpdatePriority(e.target.value)}
                      >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Update Status</label>
                      <select
                        className="form-control"
                        value={updateStatus}
                        onChange={(e) => setUpdateStatus(e.target.value)}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Admin Update Note / Comments (Informs resident via Email)</label>
                    <textarea
                      className="form-control"
                      placeholder="Add progress note or reason for resolution/escalation..."
                      value={updateNote}
                      onChange={(e) => setUpdateNote(e.target.value)}
                    />
                  </div>
                </div>

                {/* Vertical Timeline */}
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
                    Status History Logs
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

              <div className="form-row" style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updateSubmitting}
                >
                  {updateSubmitting ? 'Updating Ticket...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
