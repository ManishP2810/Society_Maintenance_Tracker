const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Option A: Resend HTTP API (Prefers this for Render Free Tier to bypass SMTP blocks)
  if (process.env.RESEND_API_KEY) {
    try {
      const cleanKey = process.env.RESEND_API_KEY.trim();
      
      // Resend onboarding sender email
      const fromEmail = process.env.FROM_EMAIL && !process.env.FROM_EMAIL.includes('gmail.com') 
        ? process.env.FROM_EMAIL 
        : 'onboarding@resend.dev';
        
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          from: `${process.env.FROM_NAME || 'Society Maintenance'} <${fromEmail}>`,
          to: options.email,
          subject: options.subject,
          text: options.message,
          html: options.html || `<p>${options.message}</p>`,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Resend API Error');
      }

      console.log(`Email sent successfully via Resend: ${resData.id}`);
      return resData;
    } catch (error) {
      console.error(`Resend API Error: ${error.message}. Falling back to console logging.`);
      logEmailToConsole(options);
    }
    return;
  }

  // Option B: Standard SMTP Mailer (Used locally or on paid instances)
  const isConfigured =
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS;

  if (isConfigured) {
    try {
      const cleanHost = process.env.EMAIL_HOST.trim();
      const cleanUser = process.env.EMAIL_USER.trim();
      const cleanPass = process.env.EMAIL_PASS.replace(/['"]/g, '').trim();
      const port = parseInt(process.env.EMAIL_PORT) || 587;

      let transporterConfig = {
        host: cleanHost,
        port: port,
        secure: port === 465,
        auth: {
          user: cleanUser,
          pass: cleanPass,
        },
        tls: {
          rejectUnauthorized: false
        }
      };

      // Use Nodemailer's built-in Gmail optimization if host is Gmail
      if (cleanHost.includes('gmail.com')) {
        transporterConfig = {
          service: 'gmail',
          auth: {
            user: cleanUser,
            pass: cleanPass
          }
        };
      }

      const transporter = nodemailer.createTransport(transporterConfig);

      const message = {
        from: `${process.env.FROM_NAME || 'Society Maintenance'} <${process.env.FROM_EMAIL || 'noreply@societytracker.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || `<p>${options.message}</p>`,
      };

      const info = await transporter.sendMail(message);
      console.log(`Email sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`Nodemailer Error: ${error.message}. Falling back to console logging.`);
      logEmailToConsole(options);
    }
  } else {
    // Mock email by logging to console
    logEmailToConsole(options);
  }
};

const logEmailToConsole = (options) => {
  console.log('========================================================================');
  console.log('📬 [MOCK EMAIL SENT]');
  console.log(`FROM: ${process.env.FROM_NAME || 'Society Maintenance'} <${process.env.FROM_EMAIL || 'noreply@societytracker.com'}>`);
  console.log(`TO: ${options.email}`);
  console.log(`SUBJECT: ${options.subject}`);
  console.log(`MESSAGE:\n${options.message}`);
  if (options.html) {
    console.log(`HTML BODY:\n${options.html}`);
  }
  console.log('========================================================================');
};

module.exports = sendEmail;
