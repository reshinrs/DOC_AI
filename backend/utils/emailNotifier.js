const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a notification email.
 * @param {string} toEmail The recipient's email address.
 * @param {string} subject The email subject.
 * @param {string} htmlBody The email body in HTML format.
 */
const sendNotificationEmail = async (toEmail, subject, htmlBody) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("Email notifications disabled: EMAIL_USER or EMAIL_PASS not set in .env");
      return;
  }

  try {
    await transporter.sendMail({
      from: `"MAS Document Processor" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlBody,
    });
    console.log(`Notification email sent to ${toEmail}`);
  } catch (error) {
    console.error(`Failed to send email to ${toEmail}:`, error);
  }
};

module.exports = { sendNotificationEmail };