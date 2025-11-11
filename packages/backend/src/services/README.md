# Backend Services

This directory contains shared services used across the Farm Commons backend.

## Email Service

The email service handles all email notifications for the Farm Commons platform.

### Features

- **SMTP Configuration**: Configurable SMTP settings via environment variables
- **Schedule Change Notifications**: Emails workers when schedules are created, updated, or cancelled
- **Certification Expiry Reminders**: Automated reminders for expiring certifications
- **HTML Email Templates**: Professional, responsive email templates
- **Test Email**: Built-in test email functionality for configuration verification

### Configuration

Add the following environment variables to your `.env` file:

```bash
# Email Service Configuration
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@farmcommons.org
```

### Usage

#### Import the service

```typescript
import { emailService } from './services/email.js';
```

#### Send Schedule Change Notification

```typescript
await emailService.sendScheduleChangeNotification({
  worker: workerData,
  schedule: scheduleData,
  changeType: 'created', // 'created' | 'updated' | 'cancelled'
  fieldName: 'North Field', // optional
});
```

#### Send Certification Expiry Reminder

```typescript
await emailService.sendCertificationExpiryReminder({
  worker: workerData,
  certifications: [
    {
      ...certificationData,
      daysUntilExpiry: 30,
    },
  ],
});
```

#### Test Email Configuration

```typescript
const success = await emailService.sendTestEmail('test@example.com');
console.log('Email sent:', success);
```

#### Verify SMTP Connection

```typescript
const isConnected = await emailService.verifyConnection();
console.log('SMTP connected:', isConnected);
```

### Email Templates

The service includes professionally designed HTML email templates with:

- Responsive design for mobile and desktop
- Branded headers with Farm Commons branding
- Color-coded urgency levels for certifications
- Plain text fallback for all emails

### Testing

Unit tests are provided in `__tests__/services/email.test.ts`. Run tests with:

```bash
npm test
```

The tests use mocked SMTP to avoid sending real emails during testing.

### Development

When `EMAIL_ENABLED=false`, the service will log email attempts without actually sending them, useful for local development.

### Security Notes

- Never commit SMTP credentials to version control
- Use app-specific passwords for Gmail accounts
- Consider using environment-specific email addresses
- Enable TLS/SSL for production SMTP connections
