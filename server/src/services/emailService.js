const nodemailer = require('nodemailer');

// In-memory array for inspecting sent emails during tests
let mockSentEmails = [];

/**
 * Configure Nodemailer Transporter
 */
const getTransporter = () => {
  const isTest = process.env.NODE_ENV === 'test' || process.env.MOCK_EMAIL === 'true';

  if (isTest) {
    return {
      sendMail: async (mailOptions) => {
        mockSentEmails.push(mailOptions);
        return { messageId: `test-msg-${Date.now()}` };
      }
    };
  }

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });
  }

  // Fallback for development if SMTP is not yet configured: simulate dispatch
  return {
    sendMail: async (mailOptions) => {
      console.log(`[EMAIL DEV FALLBACK] Simulated email dispatched to: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
      return { messageId: `dev-simulated-${Date.now()}` };
    }
  };
};

/**
 * Format Remaining Time dynamically
 */
const formatRemainingTime = (deadlineDate, referenceTime = new Date()) => {
  const target = new Date(deadlineDate).getTime();
  const ref = new Date(referenceTime).getTime();
  const diffMs = target - ref;

  if (diffMs <= 0) return 'Deadline has passed';

  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}, ${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
};

/**
 * Format date in UTC with unambiguous date and time
 */
const formatDateUTC = (date) => {
  const d = new Date(date);
  return d.toUTCString();
};

/**
 * Generate professional, responsive HTML email template
 */
const generateReminderHtml = ({
  appName = 'Project Monitor & Planner',
  recipientName = 'Team Member',
  entityType = 'Task',
  title,
  projectOrSubject = 'Workspace',
  deadline,
  remainingTime,
  priority = 'Medium',
  status = 'In Progress',
  reminderType = '24h',
  appUrl = 'http://localhost:5173'
}) => {
  const isUrgent = reminderType === '1h';
  const badgeColor = isUrgent ? '#dc2626' : '#d97706';
  const alertTitle = isUrgent ? 'URGENT: 1 HOUR BEFORE DEADLINE' : 'DEADLINE REMINDER: 24 HOURS REMAINING';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${alertTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; color: #ffffff; letter-spacing: 0.5px; font-weight: 700; }
    .alert-banner { background-color: ${badgeColor}; color: #ffffff; text-align: center; font-size: 13px; font-weight: 800; letter-spacing: 1px; padding: 10px 16px; text-transform: uppercase; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 16px; color: #e2e8f0; margin-bottom: 20px; }
    .card { background-color: #0f172a; border-radius: 8px; border: 1px solid #334155; padding: 20px; margin-bottom: 24px; }
    .item-title { font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }
    .detail-label { color: #94a3b8; }
    .detail-value { font-weight: 600; color: #f1f5f9; text-align: right; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
    .badge-priority { background-color: #3b82f6; color: #ffffff; }
    .cta-container { text-align: center; margin: 32px 0 16px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4); }
    .footer { padding: 20px 28px; background-color: #0f172a; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${appName}</h1>
    </div>
    <div class="alert-banner">
      ${alertTitle}
    </div>
    <div class="content">
      <p class="greeting">Hello <strong>${recipientName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px;">
        This is an automated reminder that your upcoming <strong>${entityType}</strong> deadline is approaching soon.
      </p>

      <div class="card">
        <h2 class="item-title">${title}</h2>
        <div class="detail-row">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${entityType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Project / Subject:</span>
          <span class="detail-value">${projectOrSubject}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Deadline (UTC):</span>
          <span class="detail-value" style="color: #f59e0b;">${formatDateUTC(deadline)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time Remaining:</span>
          <span class="detail-value" style="color: ${badgeColor}; font-weight: 700;">${remainingTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Priority:</span>
          <span class="detail-value"><span class="badge badge-priority">${priority}</span></span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Status:</span>
          <span class="detail-value">${status}</span>
        </div>
      </div>

      <div class="cta-container">
        <a href="${appUrl}" class="cta-button" target="_blank" rel="noopener noreferrer">
          Open in ${appName}
        </a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">You received this email because you are assigned as the responsible owner for this deadline.</p>
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Validate email address format
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email.trim());
};

/**
 * Send deadline reminder email safely
 * Catches all errors and never crashes the server
 */
const sendDeadlineReminderEmail = async ({
  to,
  recipientName = 'User',
  entityType = 'Task',
  title,
  projectOrSubject = 'General',
  deadline,
  reminderType = '24h',
  priority = 'Medium',
  status = 'In Progress',
  referenceTime = new Date()
}) => {
  // Validate email address
  if (!isValidEmail(to)) {
    console.warn(`[EMAIL] Reminder skipped: Invalid email address "${to}" for ${entityType} "${title}"`);
    return { success: false, reason: 'invalid_email' };
  }

  const appName = 'Project Monitor & Planner';
  const remainingTime = formatRemainingTime(deadline, referenceTime);
  const isUrgent = reminderType === '1h';
  const subject = isUrgent
    ? `[URGENT] 1 Hour Remaining: "${title}" (${entityType})`
    : `[Reminder] 24 Hours Remaining: "${title}" (${entityType})`;

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const html = generateReminderHtml({
    appName,
    recipientName,
    entityType,
    title,
    projectOrSubject,
    deadline,
    remainingTime,
    priority,
    status,
    reminderType,
    appUrl: clientUrl
  });

  const mailOptions = {
    from: process.env.MAIL_FROM || `"Project Monitor" <notifications@projectmonitor.local>`,
    to: to.trim().toLowerCase(),
    subject,
    html,
    text: `${appName} Reminder\n\n${entityType}: ${title}\nProject/Subject: ${projectOrSubject}\nDeadline (UTC): ${formatDateUTC(deadline)}\nRemaining Time: ${remainingTime}\nPriority: ${priority}\nStatus: ${status}\n\nView at: ${clientUrl}`
  };

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[EMAIL] ${reminderType === '24h' ? '24-hour' : '1-hour'} reminder sent to ${to} for ${entityType} "${title}" (MessageID: ${info.messageId || 'ok'})`
    );
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL] Failed to send reminder to ${to} for ${entityType} "${title}": ${err.message}`);
    return { success: false, error: err.message };
  }
};

/**
 * Helpers for test suite to inspect and clear mock sent emails
 */
const getMockSentEmails = () => [...mockSentEmails];
const clearMockSentEmails = () => {
  mockSentEmails = [];
};

module.exports = {
  sendDeadlineReminderEmail,
  generateReminderHtml,
  formatRemainingTime,
  formatDateUTC,
  isValidEmail,
  getMockSentEmails,
  clearMockSentEmails
};
