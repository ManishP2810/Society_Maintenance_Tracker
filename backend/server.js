const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/settings', require('./routes/settings').router);
app.use('/api/notices', require('./routes/notices'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Society Maintenance Tracker API is running' });
});

// Email diagnostic endpoint (temporary)
app.get('/api/health/test-email', async (req, res) => {
  try {
    console.log('Diagnostic API: Sending test email...');
    
    // Check if Resend is configured
    if (process.env.RESEND_API_KEY) {
      const cleanKey = process.env.RESEND_API_KEY.trim();
      const cleanUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : 'manishpunde28@gmail.com';
      const fromEmail = 'onboarding@resend.dev';
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          from: `SMTP Test <${fromEmail}>`,
          to: cleanUser,
          subject: 'Render Resend Live Diagnostic',
          text: 'Resend API connection is active and sending emails from Render successfully!'
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Resend API Error');
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Resend API configuration verified and test email sent!', 
        info: resData 
      });
    }

    // SMTP Fallback
    const nodemailer = require('nodemailer');
    const cleanHost = process.env.EMAIL_HOST ? process.env.EMAIL_HOST.trim() : '';
    const cleanUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
    const cleanPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/['"]/g, '').trim() : '';
    const port = parseInt(process.env.EMAIL_PORT) || 587;

    let config = {
      host: cleanHost,
      port: port,
      secure: port === 465,
      auth: { user: cleanUser, pass: cleanPass },
      tls: { rejectUnauthorized: false }
    };
    if (cleanHost.includes('gmail.com')) {
      config = {
        service: 'gmail',
        auth: { user: cleanUser, pass: cleanPass }
      };
    }
    
    const transporter = nodemailer.createTransport(config);
    await transporter.verify();
    
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'SMTP Test'}" <${process.env.FROM_EMAIL || cleanUser}>`,
      to: cleanUser,
      subject: 'Render SMTP Live Diagnostic',
      text: 'SMTP connection is active and sending emails from Render successfully!'
    });

    res.status(200).json({ 
      success: true, 
      message: 'SMTP configuration verified and test email sent!', 
      info: { messageId: info.messageId, accepted: info.accepted } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      stack: error.stack, 
      config: {
        resendConfigured: !!process.env.RESEND_API_KEY,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        passLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0
      }
    });
  }
});

// Serve static frontend assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please close the other application running on this port, or change the PORT variable in backend/.env`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
