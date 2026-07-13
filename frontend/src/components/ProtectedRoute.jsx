import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'var(--font-display)',
        color: 'var(--primary)',
        fontSize: '1.5rem',
      }}>
        Loading Society Tracker...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
      }}>
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
          You do not have the required permissions to view this page.
        </p>
        <button
          className="btn btn-primary"
          style={{ marginTop: '1.5rem' }}
          onClick={() => window.location.href = user.role === 'admin' ? '/admin' : '/resident'}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
