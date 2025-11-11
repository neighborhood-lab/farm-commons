// Unit tests for Email Service
// Tests email functionality with mock SMTP

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EmailService } from '../../services/email.js';
import type { Worker, Schedule, Certification } from '@farm-commons/shared';

// Mock nodemailer
const mockSendMail = vi.fn();
const mockVerify = vi.fn();

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
      verify: mockVerify,
    })),
  },
}));

describe('EmailService', () => {
  let emailService: EmailService;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up environment variables for testing
    process.env = {
      ...originalEnv,
      EMAIL_ENABLED: 'true',
      SMTP_HOST: 'smtp.test.com',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'test@example.com',
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords
      SMTP_PASSWORD: 'testpassword',
      SMTP_FROM: 'noreply@farmcommons.test',
    };

    emailService = new EmailService();
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });
    mockVerify.mockResolvedValue(true);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Initialization', () => {
    it('should initialize with correct SMTP configuration', () => {
      expect(emailService).toBeDefined();
    });

    it('should not initialize transporter when email is disabled', () => {
      process.env.EMAIL_ENABLED = 'false';
      const disabledService = new EmailService();
      expect(disabledService).toBeDefined();
    });
  });

  describe('verifyConnection', () => {
    it('should verify SMTP connection successfully', async () => {
      mockVerify.mockResolvedValueOnce(true);
      const result = await emailService.verifyConnection();
      expect(result).toBe(true);
      expect(mockVerify).toHaveBeenCalled();
    });

    it('should return false when verification fails', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Connection failed'));
      const result = await emailService.verifyConnection();
      expect(result).toBe(false);
    });

    it('should return false when email service is disabled', async () => {
      process.env.EMAIL_ENABLED = 'false';
      const disabledService = new EmailService();
      const result = await disabledService.verifyConnection();
      expect(result).toBe(false);
    });
  });

  describe('sendScheduleChangeNotification', () => {
    const mockWorker: Worker = {
      id: 'worker-1',
      farm_id: 'farm-1',
      user_id: 'user-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      preferred_language: 'en',
      emergency_contact_name: 'Jane Doe',
      emergency_contact_phone: '+1987654321',
      hire_date: new Date('2024-01-01'),
      status: 'active',
      hourly_rate: 15,
      piece_rate: null,
      certifications: [],
      skills: [],
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockSchedule: Schedule = {
      id: 'schedule-1',
      farm_id: 'farm-1',
      worker_id: 'worker-1',
      field_id: 'field-1',
      scheduled_date: new Date('2024-12-01'),
      start_time: '08:00',
      end_time: '16:00',
      task_type: 'Planting',
      task_description: 'Plant tomatoes',
      status: 'scheduled',
      notes: 'Bring gloves',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should send email for new schedule creation', async () => {
      const result = await emailService.sendScheduleChangeNotification({
        worker: mockWorker,
        schedule: mockSchedule,
        changeType: 'created',
        fieldName: 'North Field',
      });

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@farmcommons.test',
          to: 'john.doe@example.com',
          subject: 'New Schedule Assignment - Farm Commons',
          text: expect.stringContaining('John Doe'),
          html: expect.stringContaining('John Doe'),
        })
      );
    });

    it('should send email for schedule update', async () => {
      const result = await emailService.sendScheduleChangeNotification({
        worker: mockWorker,
        schedule: mockSchedule,
        changeType: 'updated',
      });

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Schedule Update - Farm Commons',
        })
      );
    });

    it('should send email for schedule cancellation', async () => {
      const result = await emailService.sendScheduleChangeNotification({
        worker: mockWorker,
        schedule: mockSchedule,
        changeType: 'cancelled',
      });

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Schedule Cancelled - Farm Commons',
        })
      );
    });

    it('should include field name in email when provided', async () => {
      await emailService.sendScheduleChangeNotification({
        worker: mockWorker,
        schedule: mockSchedule,
        changeType: 'created',
        fieldName: 'South Field',
      });

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.text).toContain('South Field');
      expect(emailCall.html).toContain('South Field');
    });

    it('should include task description when provided', async () => {
      await emailService.sendScheduleChangeNotification({
        worker: mockWorker,
        schedule: mockSchedule,
        changeType: 'created',
      });

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.text).toContain('Plant tomatoes');
      expect(emailCall.html).toContain('Plant tomatoes');
    });

    it('should include notes when provided', async () => {
      await emailService.sendScheduleChangeNotification({
        worker: mockWorker,
        schedule: mockSchedule,
        changeType: 'created',
      });

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.text).toContain('Bring gloves');
      expect(emailCall.html).toContain('Bring gloves');
    });

    it('should return false when worker has no email', async () => {
      const workerWithoutEmail = { ...mockWorker, email: null };
      const result = await emailService.sendScheduleChangeNotification({
        worker: workerWithoutEmail,
        schedule: mockSchedule,
        changeType: 'created',
      });

      expect(result).toBe(false);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should handle email sending errors gracefully', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const result = await emailService.sendScheduleChangeNotification({
        worker: mockWorker,
        schedule: mockSchedule,
        changeType: 'created',
      });

      expect(result).toBe(false);
    });
  });

  describe('sendCertificationExpiryReminder', () => {
    const mockWorker: Worker = {
      id: 'worker-1',
      farm_id: 'farm-1',
      user_id: 'user-1',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1234567890',
      preferred_language: 'en',
      emergency_contact_name: 'John Smith',
      emergency_contact_phone: '+1987654321',
      hire_date: new Date('2024-01-01'),
      status: 'active',
      hourly_rate: 16,
      piece_rate: null,
      certifications: ['Forklift', 'First Aid'],
      skills: [],
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockCertifications = [
      {
        id: 'cert-1',
        worker_id: 'worker-1',
        name: 'Forklift Operator',
        issuing_organization: 'OSHA',
        issue_date: new Date('2024-01-01'),
        expiration_date: new Date('2025-01-01'),
        document_url: 'https://example.com/cert1.pdf',
        verified: true,
        created_at: new Date(),
        updated_at: new Date(),
        daysUntilExpiry: 30,
      },
      {
        id: 'cert-2',
        worker_id: 'worker-1',
        name: 'First Aid Certification',
        issuing_organization: 'Red Cross',
        issue_date: new Date('2024-02-01'),
        expiration_date: new Date('2025-02-01'),
        document_url: 'https://example.com/cert2.pdf',
        verified: true,
        created_at: new Date(),
        updated_at: new Date(),
        daysUntilExpiry: 60,
      },
    ];

    it('should send certification expiry reminder', async () => {
      const result = await emailService.sendCertificationExpiryReminder({
        worker: mockWorker,
        certifications: mockCertifications,
      });

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@farmcommons.test',
          to: 'jane.smith@example.com',
          subject: 'Certification Expiry Reminder - Farm Commons',
          text: expect.stringContaining('Jane Smith'),
          html: expect.stringContaining('Jane Smith'),
        })
      );
    });

    it('should include all certifications in the email', async () => {
      await emailService.sendCertificationExpiryReminder({
        worker: mockWorker,
        certifications: mockCertifications,
      });

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.text).toContain('Forklift Operator');
      expect(emailCall.text).toContain('First Aid Certification');
      expect(emailCall.text).toContain('OSHA');
      expect(emailCall.text).toContain('Red Cross');
      expect(emailCall.html).toContain('Forklift Operator');
      expect(emailCall.html).toContain('First Aid Certification');
    });

    it('should show days until expiry for each certification', async () => {
      await emailService.sendCertificationExpiryReminder({
        worker: mockWorker,
        certifications: mockCertifications,
      });

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.text).toContain('30 days');
      expect(emailCall.text).toContain('60 days');
      expect(emailCall.html).toContain('30 days');
      expect(emailCall.html).toContain('60 days');
    });

    it('should sort certifications by expiry date (soonest first)', async () => {
      const reversedCerts = [...mockCertifications].reverse();

      await emailService.sendCertificationExpiryReminder({
        worker: mockWorker,
        certifications: reversedCerts,
      });

      const emailCall = mockSendMail.mock.calls[0][0];
      const forkliftIndex = emailCall.text.indexOf('Forklift Operator');
      const firstAidIndex = emailCall.text.indexOf('First Aid Certification');

      // Forklift (30 days) should appear before First Aid (60 days)
      expect(forkliftIndex).toBeLessThan(firstAidIndex);
    });

    it('should show correct count of expiring certifications', async () => {
      await emailService.sendCertificationExpiryReminder({
        worker: mockWorker,
        certifications: mockCertifications,
      });

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.text).toContain('2 certification(s)');
      expect(emailCall.html).toContain('2');
    });

    it('should return false when worker has no email', async () => {
      const workerWithoutEmail = { ...mockWorker, email: null };
      const result = await emailService.sendCertificationExpiryReminder({
        worker: workerWithoutEmail,
        certifications: mockCertifications,
      });

      expect(result).toBe(false);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should handle certifications without expiration date', async () => {
      const certsWithNoExpiry = [
        {
          ...mockCertifications[0],
          expiration_date: null,
          daysUntilExpiry: 999,
        },
      ];

      const result = await emailService.sendCertificationExpiryReminder({
        worker: mockWorker,
        certifications: certsWithNoExpiry,
      });

      expect(result).toBe(true);
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.text).toContain('No expiration date');
    });

    it('should handle email sending errors gracefully', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const result = await emailService.sendCertificationExpiryReminder({
        worker: mockWorker,
        certifications: mockCertifications,
      });

      expect(result).toBe(false);
    });
  });

  describe('sendTestEmail', () => {
    it('should send a test email successfully', async () => {
      const result = await emailService.sendTestEmail('test@example.com');

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Email - Farm Commons',
          text: expect.stringContaining('test email'),
          html: expect.stringContaining('Test Email'),
        })
      );
    });

    it('should handle errors when sending test email', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Send failed'));

      const result = await emailService.sendTestEmail('test@example.com');

      expect(result).toBe(false);
    });
  });

  describe('Email service disabled', () => {
    it('should not send emails when service is disabled', async () => {
      process.env.EMAIL_ENABLED = 'false';
      const disabledService = new EmailService();

      const mockWorker: Worker = {
        id: 'worker-1',
        farm_id: 'farm-1',
        user_id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        preferred_language: 'en',
        emergency_contact_name: null,
        emergency_contact_phone: null,
        hire_date: new Date('2024-01-01'),
        status: 'active',
        hourly_rate: 15,
        piece_rate: null,
        certifications: [],
        skills: [],
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockSchedule: Schedule = {
        id: 'schedule-1',
        farm_id: 'farm-1',
        worker_id: 'worker-1',
        field_id: null,
        scheduled_date: new Date('2024-12-01'),
        start_time: '08:00',
        end_time: '16:00',
        task_type: 'Planting',
        task_description: null,
        status: 'scheduled',
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = await disabledService.sendScheduleChangeNotification({
        worker: mockWorker,
        schedule: mockSchedule,
        changeType: 'created',
      });

      expect(result).toBe(false);
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('HTML Email Templates', () => {
    it('should generate valid HTML for schedule notifications', async () => {
      const mockWorker: Worker = {
        id: 'worker-1',
        farm_id: 'farm-1',
        user_id: 'user-1',
        first_name: 'Test',
        last_name: 'Worker',
        email: 'test@example.com',
        phone: '+1234567890',
        preferred_language: 'en',
        emergency_contact_name: null,
        emergency_contact_phone: null,
        hire_date: new Date('2024-01-01'),
        status: 'active',
        hourly_rate: 15,
        piece_rate: null,
        certifications: [],
        skills: [],
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockSchedule: Schedule = {
        id: 'schedule-1',
        farm_id: 'farm-1',
        worker_id: 'worker-1',
        field_id: null,
        scheduled_date: new Date('2024-12-01'),
        start_time: '08:00',
        end_time: '16:00',
        task_type: 'Harvesting',
        task_description: null,
        status: 'scheduled',
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await emailService.sendScheduleChangeNotification({
        worker: mockWorker,
        schedule: mockSchedule,
        changeType: 'created',
      });

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('<!DOCTYPE html>');
      expect(emailCall.html).toContain('</html>');
      expect(emailCall.html).toContain('<style>');
    });

    it('should generate valid HTML for certification reminders', async () => {
      const mockWorker: Worker = {
        id: 'worker-1',
        farm_id: 'farm-1',
        user_id: 'user-1',
        first_name: 'Test',
        last_name: 'Worker',
        email: 'test@example.com',
        phone: '+1234567890',
        preferred_language: 'en',
        emergency_contact_name: null,
        emergency_contact_phone: null,
        hire_date: new Date('2024-01-01'),
        status: 'active',
        hourly_rate: 15,
        piece_rate: null,
        certifications: [],
        skills: [],
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockCertifications = [
        {
          id: 'cert-1',
          worker_id: 'worker-1',
          name: 'Test Cert',
          issuing_organization: 'Test Org',
          issue_date: new Date('2024-01-01'),
          expiration_date: new Date('2025-01-01'),
          document_url: null,
          verified: true,
          created_at: new Date(),
          updated_at: new Date(),
          daysUntilExpiry: 30,
        },
      ];

      await emailService.sendCertificationExpiryReminder({
        worker: mockWorker,
        certifications: mockCertifications,
      });

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('<!DOCTYPE html>');
      expect(emailCall.html).toContain('</html>');
      expect(emailCall.html).toContain('<style>');
    });
  });
});
