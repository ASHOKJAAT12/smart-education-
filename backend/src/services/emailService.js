const nodemailer = require('nodemailer');

/**
 * Email service using Brevo SMTP via Nodemailer.
 *
 * All email sending is centralised here. Controllers never call nodemailer directly.
 * If Brevo credentials are not set, emails are logged to console (dev fallback).
 */

let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
        console.warn('⚠️  Brevo SMTP credentials not set — emails will be logged to console only');
        return null;
    }

    transporter = nodemailer.createTransport({
        host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.BREVO_SMTP_PORT) || 587,
        secure: false, // STARTTLS
        auth: {
            user: process.env.BREVO_SMTP_USER,
            pass: process.env.BREVO_SMTP_PASS,
        },
    });

    return transporter;
};

/**
 * Send an email.
 * @param {object} options - { to, subject, html, text? }
 */
const sendEmail = async ({ to, subject, html, text }) => {
    const from = `"${process.env.BREVO_FROM_NAME || 'SmartLearn AI'}" <${process.env.BREVO_FROM_EMAIL || 'noreply@smartlearnai.com'}>`;
    const transport = getTransporter();

    if (!transport) {
        // Dev fallback — print to console
        console.log('\n📧 [EMAIL - DEV MODE]');
        console.log(`   To     : ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Body   : ${text || html}`);
        console.log('─────────────────────────────────────\n');
        return;
    }

    await transport.sendMail({ from, to, subject, html, text });
};

// ─── Email templates ──────────────────────────────────────────────────────

/**
 * Send password reset email with a tokenised link.
 * @param {string} email - recipient
 * @param {string} resetToken - plain (unhashed) reset token
 */
const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    await sendEmail({
        to: email,
        subject: 'SmartLearn AI — Reset Your Password',
        html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0f0f1a; color: #e2e8f0; border-radius: 12px;">
        <h1 style="color: #6366f1; margin-bottom: 8px;">SmartLearn AI</h1>
        <h2 style="font-size: 18px; margin-bottom: 16px;">Reset Your Password</h2>
        <p>We received a request to reset your password. Click the button below to create a new password. This link expires in <strong>10 minutes</strong>.</p>
        <a href="${resetUrl}" 
           style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Reset Password
        </a>
        <p style="font-size: 13px; color: #94a3b8;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Or copy this link:<br>${resetUrl}</p>
      </div>
    `,
        text: `Reset your SmartLearn AI password here (valid 10 minutes): ${resetUrl}`,
    });
};

/**
 * Send welcome email after registration.
 */
const sendWelcomeEmail = async (email, name) => {
    await sendEmail({
        to: email,
        subject: 'Welcome to SmartLearn AI 🎓',
        html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0f0f1a; color: #e2e8f0; border-radius: 12px;">
        <h1 style="color: #6366f1;">Welcome, ${name}! 🎓</h1>
        <p>Your SmartLearn AI account is ready. Start your personalized learning journey today.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/student/dashboard" 
           style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Go to Dashboard
        </a>
      </div>
    `,
        text: `Welcome to SmartLearn AI, ${name}! Visit your dashboard: ${process.env.CLIENT_URL || 'http://localhost:5173'}/student/dashboard`,
    });
};

module.exports = { sendEmail, sendPasswordResetEmail, sendWelcomeEmail };
