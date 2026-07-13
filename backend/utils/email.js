const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const isConfigured =
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS;

  if (isConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

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
