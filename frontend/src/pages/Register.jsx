import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the landing page with query parameter to trigger register modal
    navigate('/login?register=true', { replace: true });
  }, [navigate]);

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ textAlign: 'center' }}>
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem' }}>Redirecting to Portal...</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Please wait while we transfer you to the smart society portal registration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
