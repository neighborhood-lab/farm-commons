// Farm Commons Email Service
// Handles email notifications for schedule changes and certification expiry

import nodemailer, { type Transporter } from 'nodemailer';
import type { SentMessageInfo } from 'nodemailer';
import pino from 'pino';
import type { Worker, Schedule, Certification } from '@farm-commons/shared';

const logger = pino({
  name: 'email-service',
  level: process.env.LOG_LEVEL || 'info',
});

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface ScheduleChangeEmailData {
  worker: Worker;
  schedule: Schedule;
  changeType: 'created' | 'updated' | 'cancelled';
  fieldName?: string;
}

interface CertificationExpiryEmailData {
  worker: Worker;
  certifications: Array<Certification & { daysUntilExpiry: number }>;
}

/**
 * Email Service for Farm Commons
 * Handles all email notifications using SMTP
 */
export class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.EMAIL_ENABLED === 'true';

    this.config = {
      host: process.env.SMTP_HOST || 'localhost',
      port: Number.Number.Number.Number.Number.Number.Number.Number.parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
      from: process.env.SMTP_FROM || 'noreply@farmcommons.org',
    };

    if (this.enabled) {
      this.initializeTransporter();
    } else {
      logger.info('Email service is disabled. Set EMAIL_ENABLED=true to enable.');
    }
  }

  /**
   * Initialize the SMTP transporter
   */
  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.auth.user,
          pass: this.config.auth.pass,
        },
      });

      logger.info(`Email transporter initialized with host: ${this.config.host}`);
    } catch {
      logger.error('Failed to initialize email transporter', error);
      throw error;
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      logger.warn('Email service is not enabled or transporter not initialized');
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      return true;
    } catch {
      logger.error('SMTP connection verification failed', error);
      return false;
    }
  }

  /**
   * Send a generic email
   */
  private async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      logger.debug('Email not sent - service disabled or not configured', {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }

    try {
      const info: SentMessageInfo = await this.transporter.sendMail({
        from: this.config.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
      });

      return true;
    } catch {
      logger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
        error,
      });
      return false;
    }
  }

  /**
   * Send schedule change notification
   */
  async sendScheduleChangeNotification(
    data: ScheduleChangeEmailData
  ): Promise<boolean> {
    const { worker, schedule, changeType, fieldName } = data;

    if (!worker.email) {
      logger.warn('Worker has no email address', { workerId: worker.id });
      return false;
    }

    const subject = this.getScheduleChangeSubject(changeType);
    const { text, html } = this.generateScheduleChangeEmail(
      data,
      changeType,
      fieldName
    );

    return this.sendEmail({
      to: worker.email,
      subject,
      text,
      html,
    });
  }

  /**
   * Send certification expiry reminder
   */
  async sendCertificationExpiryReminder(
    data: CertificationExpiryEmailData
  ): Promise<boolean> {
    const { worker, certifications } = data;

    if (!worker.email) {
      logger.warn('Worker has no email address', { workerId: worker.id });
      return false;
    }

    const subject = 'Certification Expiry Reminder - Farm Commons';
    const { text, html } = this.generateCertificationExpiryEmail(
      worker,
      certifications
    );

    return this.sendEmail({
      to: worker.email,
      subject,
      text,
      html,
    });
  }

  /**
   * Generate schedule change email subject
   */
  private getScheduleChangeSubject(changeType: string): string {
    switch (changeType) {
      case 'created':
        return 'New Schedule Assignment - Farm Commons';
      case 'updated':
        return 'Schedule Update - Farm Commons';
      case 'cancelled':
        return 'Schedule Cancelled - Farm Commons';
      default:
        return 'Schedule Notification - Farm Commons';
    }
  }

  /**
   * Generate schedule change email content
   */
  private generateScheduleChangeEmail(
    data: ScheduleChangeEmailData,
    changeType: string,
    fieldName?: string
  ): { text: string; html: string } {
    const { worker, schedule } = data;
    const workerName = `${worker.first_name} ${worker.last_name}`;
    const scheduleDate = new Date(schedule.scheduled_date).toLocaleDateString();
    const location = fieldName ? ` at ${fieldName}` : '';

    let action = '';
    let actionDetail = '';

    switch (changeType) {
      case 'created':
        action = 'assigned to a new schedule';
        actionDetail = 'You have been scheduled for a new task.';
        break;
      case 'updated':
        action = 'notified of a schedule change';
        actionDetail = 'Your schedule has been updated.';
        break;
      case 'cancelled':
        action = 'notified that a schedule has been cancelled';
        actionDetail = 'A scheduled task has been cancelled.';
        break;
    }

    // Plain text version
    const text = `
Hello ${workerName},

You have been ${action}.

${actionDetail}

Schedule Details:
- Date: ${scheduleDate}
- Time: ${schedule.start_time} - ${schedule.end_time}
- Task: ${schedule.task_type}${location}
${schedule.task_description ? `- Description: ${schedule.task_description}` : ''}
${schedule.notes ? `- Notes: ${schedule.notes}` : ''}

If you have any questions or concerns, please contact your farm manager.

Best regards,
Farm Commons Team
    `.trim();

    // HTML version
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.1">
  <title>Schedule Notification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #22c55e;
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background-color: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .schedule-details {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #22c55e;
    }
    .schedule-details h3 {
      margin-top: 0;
      color: #22c55e;
    }
    .detail-row {
      margin: 10px 0;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: 600;
      color: #6b7280;
      display: inline-block;
      width: 120px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">🚜 Farm Commons</h1>
    <p style="margin: 10px 0 0 0;">Schedule Notification</p>
  </div>

  <div class="content">
    <p>Hello <strong>${workerName}</strong>,</p>

    <p>You have been ${action}.</p>

    <p>${actionDetail}</p>

    <div class="schedule-details">
      <h3>Schedule Details</h3>

      <div class="detail-row">
        <span class="label">Date:</span>
        <span>${scheduleDate}</span>
      </div>

      <div class="detail-row">
        <span class="label">Time:</span>
        <span>${schedule.start_time} - ${schedule.end_time}</span>
      </div>

      <div class="detail-row">
        <span class="label">Task:</span>
        <span>${schedule.task_type}${location}</span>
      </div>

      ${schedule.task_description ? `
        <div class="detail-row">
          <span class="label">Description:</span>
          <span>${schedule.task_description}</span>
        </div>
      ` : ''}

      ${schedule.notes ? `
        <div class="detail-row">
          <span class="label">Notes:</span>
          <span>${schedule.notes}</span>
        </div>
      ` : ''}
    </div>

    <p>If you have any questions or concerns, please contact your farm manager.</p>

    <p>Best regards,<br>
    <strong>Farm Commons Team</strong></p>
  </div>

  <div class="footer">
    <p>This is an automated message from Farm Commons.<br>
    Shared farm management software, community owned.</p>
  </div>
</body>
</html>
    `.trim();

    return { text, html };
  }

  /**
   * Generate certification expiry reminder email content
   */
  private generateCertificationExpiryEmail(
    worker: Worker,
    certifications: Array<Certification & { daysUntilExpiry: number }>
  ): { text: string; html: string } {
    const workerName = `${worker.first_name} ${worker.last_name}`;

    // Sort certifications by days until expiry
    const sortedCerts = [...certifications].sort(
      (a, b) => a.daysUntilExpiry - b.daysUntilExpiry
    );

    // Generate certification list for text
    const certListText = sortedCerts
      .map((cert) => {
        const expiryDate = cert.expiration_date
          ? new Date(cert.expiration_date).toLocaleDateString()
          : 'No expiration date';
        return `  - ${cert.name} (${cert.issuing_organization}) - Expires: ${expiryDate} (${cert.daysUntilExpiry} days)`;
      })
      .join('\n');

    // Plain text version
    const text = `
Hello ${workerName},

This is a reminder that you have ${certifications.length} certification(s) expiring soon.

Certifications Requiring Renewal:
${certListText}

Please ensure you renew these certifications before they expire to maintain your qualifications.

To update your certifications, please contact your farm manager or update them in the Farm Commons system.

Best regards,
Farm Commons Team
    `.trim();

    // Generate certification list for HTML
    const certListHtml = sortedCerts
      .map((cert) => {
        const expiryDate = cert.expiration_date
          ? new Date(cert.expiration_date).toLocaleDateString()
          : 'No expiration date';
        const urgencyClass =
          cert.daysUntilExpiry <= 30
            ? 'urgent'
            : cert.daysUntilExpiry <= 60
            ? 'warning'
            : 'notice';

        return `
        <div class="cert-item ${urgencyClass}">
          <div class="cert-name">${cert.name}</div>
          <div class="cert-org">${cert.issuing_organization}</div>
          <div class="cert-expiry">
            <strong>Expires:</strong> ${expiryDate}
            <span class="days-badge">${cert.daysUntilExpiry} days</span>
          </div>
        </div>
        `;
      })
      .join('');

    // HTML version
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.1">
  <title>Certification Expiry Reminder</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #ef4444;
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background-color: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .cert-list {
      margin: 20px 0;
    }
    .cert-item {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
      border-left: 4px solid #6b7280;
    }
    .cert-item.urgent {
      border-left-color: #ef4444;
      background-color: #fef2f2;
    }
    .cert-item.warning {
      border-left-color: #f59e0b;
      background-color: #fffbeb;
    }
    .cert-item.notice {
      border-left-color: #3b82f6;
      background-color: #eff6ff;
    }
    .cert-name {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .cert-org {
      color: #6b7280;
      margin-bottom: 10px;
    }
    .cert-expiry {
      font-size: 14px;
    }
    .days-badge {
      display: inline-block;
      background-color: #ef4444;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 10px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .alert-box {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">⚠️ Certification Expiry Reminder</h1>
    <p style="margin: 10px 0 0 0;">Farm Commons</p>
  </div>

  <div class="content">
    <p>Hello <strong>${workerName}</strong>,</p>

    <div class="alert-box">
      <p style="margin: 0;"><strong>Important:</strong> You have <strong>${certifications.length}</strong> certification(s) expiring soon that require your attention.</p>
    </div>

    <div class="cert-list">
      <h3>Certifications Requiring Renewal:</h3>
      ${certListHtml}
    </div>

    <p>Please ensure you renew these certifications before they expire to maintain your qualifications.</p>

    <p>To update your certifications, please contact your farm manager or update them in the Farm Commons system.</p>

    <p>Best regards,<br>
    <strong>Farm Commons Team</strong></p>
  </div>

  <div class="footer">
    <p>This is an automated message from Farm Commons.<br>
    Shared farm management software, community owned.</p>
  </div>
</body>
</html>
    `.trim();

    return { text, html };
  }

  /**
   * Send test email (useful for verifying configuration)
   */
  async sendTestEmail(to: string): Promise<boolean> {
    const subject = 'Test Email - Farm Commons';
    const text = 'This is a test email from Farm Commons. If you receive this, your email configuration is working correctly.';
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Test Email</h2>
        <p>This is a test email from Farm Commons.</p>
        <p>If you receive this, your email configuration is working correctly.</p>
      </div>
    `;

    return this.sendEmail({ to, subject, text, html });
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types for use in other modules
export type { ScheduleChangeEmailData, CertificationExpiryEmailData };
