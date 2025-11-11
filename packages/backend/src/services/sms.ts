// SMS Notification Service using Twilio
// Provides SMS notifications for workers with multi-language support

import twilio from 'twilio';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  name: 'sms-service',
});

// Twilio client configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client (will be null if credentials not provided)
let twilioClient: ReturnType<typeof twilio> | null = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
  logger.info('Twilio SMS service initialized');
} else {
  logger.warn('Twilio credentials not provided. SMS service running in mock mode.');
}

// Supported languages
export type Language = 'en' | 'es';

// SMS notification types
export interface ScheduleChangeNotification {
  type: 'schedule_change';
  workerName: string;
  date: string;
  time: string;
  task: string;
  location: string;
  change?: string; // What changed (optional)
}

export interface EmergencyNotification {
  type: 'emergency';
  title: string;
  message: string;
  location?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface ClockInOutConfirmation {
  type: 'clock_in' | 'clock_out';
  workerName: string;
  timestamp: string;
  location?: string;
}

export type NotificationData =
  | ScheduleChangeNotification
  | EmergencyNotification
  | ClockInOutConfirmation;

// Message templates in English
const templatesEN = {
  schedule_change: (data: ScheduleChangeNotification): string => {
    let message = `🚜 Farm Commons Schedule Update\n\n`;
    message += `Hello ${data.workerName},\n\n`;
    message += data.change
      ? `Your schedule has been changed: ${data.change}\n\n`
      : `You have a new schedule assignment:\n\n`;
    message += `📅 Date: ${data.date}\n`;
    message += `🕐 Time: ${data.time}\n`;
    message += `📋 Task: ${data.task}\n`;
    message += `📍 Location: ${data.location}\n\n`;
    message += `Please confirm your availability.`;
    return message;
  },

  emergency: (data: EmergencyNotification): string => {
    let message = `🚨 EMERGENCY ALERT - Farm Commons\n\n`;
    message += `${data.title}\n\n`;
    message += `${data.message}\n\n`;
    if (data.location) {
      message += `📍 Location: ${data.location}\n`;
    }
    if (data.contactName && data.contactPhone) {
      message += `📞 Contact: ${data.contactName} at ${data.contactPhone}\n`;
    }
    message += `\nPlease respond immediately.`;
    return message;
  },

  clock_in: (data: ClockInOutConfirmation): string => {
    let message = `✅ Farm Commons - Clock In Confirmed\n\n`;
    message += `Hello ${data.workerName},\n\n`;
    message += `You have successfully clocked in.\n\n`;
    message += `🕐 Time: ${data.timestamp}\n`;
    if (data.location) {
      message += `📍 Location: ${data.location}\n`;
    }
    message += `\nHave a productive day!`;
    return message;
  },

  clock_out: (data: ClockInOutConfirmation): string => {
    let message = `✅ Farm Commons - Clock Out Confirmed\n\n`;
    message += `Hello ${data.workerName},\n\n`;
    message += `You have successfully clocked out.\n\n`;
    message += `🕐 Time: ${data.timestamp}\n`;
    if (data.location) {
      message += `📍 Location: ${data.location}\n`;
    }
    message += `\nThank you for your hard work!`;
    return message;
  },
};

// Message templates in Spanish
const templatesES = {
  schedule_change: (data: ScheduleChangeNotification): string => {
    let message = `🚜 Farm Commons - Actualización de Horario\n\n`;
    message += `Hola ${data.workerName},\n\n`;
    message += data.change
      ? `Tu horario ha sido modificado: ${data.change}\n\n`
      : `Tienes una nueva asignación de horario:\n\n`;
    message += `📅 Fecha: ${data.date}\n`;
    message += `🕐 Hora: ${data.time}\n`;
    message += `📋 Tarea: ${data.task}\n`;
    message += `📍 Ubicación: ${data.location}\n\n`;
    message += `Por favor confirma tu disponibilidad.`;
    return message;
  },

  emergency: (data: EmergencyNotification): string => {
    let message = `🚨 ALERTA DE EMERGENCIA - Farm Commons\n\n`;
    message += `${data.title}\n\n`;
    message += `${data.message}\n\n`;
    if (data.location) {
      message += `📍 Ubicación: ${data.location}\n`;
    }
    if (data.contactName && data.contactPhone) {
      message += `📞 Contacto: ${data.contactName} al ${data.contactPhone}\n`;
    }
    message += `\nPor favor responde inmediatamente.`;
    return message;
  },

  clock_in: (data: ClockInOutConfirmation): string => {
    let message = `✅ Farm Commons - Entrada Confirmada\n\n`;
    message += `Hola ${data.workerName},\n\n`;
    message += `Has registrado tu entrada exitosamente.\n\n`;
    message += `🕐 Hora: ${data.timestamp}\n`;
    if (data.location) {
      message += `📍 Ubicación: ${data.location}\n`;
    }
    message += `\n¡Que tengas un día productivo!`;
    return message;
  },

  clock_out: (data: ClockInOutConfirmation): string => {
    let message = `✅ Farm Commons - Salida Confirmada\n\n`;
    message += `Hola ${data.workerName},\n\n`;
    message += `Has registrado tu salida exitosamente.\n\n`;
    message += `🕐 Hora: ${data.timestamp}\n`;
    if (data.location) {
      message += `📍 Ubicación: ${data.location}\n`;
    }
    message += `\n¡Gracias por tu arduo trabajo!`;
    return message;
  },
};

// Get templates for a specific language
function getTemplates(language: Language = 'en') {
  return language === 'es' ? templatesES : templatesEN;
}

// Format notification message based on type and language
export function formatMessage(data: NotificationData, language: Language = 'en'): string {
  const templates = getTemplates(language);

  switch (data.type) {
    case 'schedule_change': {
      return templates.schedule_change(data);
    }
    case 'emergency': {
      return templates.emergency(data);
    }
    case 'clock_in': {
      return templates.clock_in(data);
    }
    case 'clock_out': {
      return templates.clock_out(data);
    }
    default: {
      throw new Error(`Unknown notification type`);
    }
  }
}

// Send SMS notification
export interface SendSMSOptions {
  to: string;
  data: NotificationData;
  language?: Language;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  mock?: boolean;
}

export async function sendSMS(options: SendSMSOptions): Promise<SMSResult> {
  const { to, data, language = 'en' } = options;

  // Validate phone number format (basic validation)
  if (!to || !/^\+?[1-9]\d{1,14}$/.test(to)) {
    logger.error({ phone: to }, 'Invalid phone number format');
    return {
      success: false,
      error: 'Invalid phone number format',
    };
  }

  // Format the message
  const message = formatMessage(data, language);

  // If Twilio is not configured, run in mock mode
  if (!twilioClient || !fromNumber) {
    logger.info(
      {
        to,
        type: data.type,
        language,
        message: message.substring(0, 100) + '...',
      },
      'SMS mock mode - message would be sent'
    );
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      mock: true,
    };
  }

  // Send SMS via Twilio
  try {
    logger.info({ to, type: data.type }, 'Sending SMS notification');

    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: to,
    });

    logger.info(
      {
        messageId: result.sid,
        to,
        type: data.type,
        status: result.status,
      },
      'SMS sent successfully'
    );

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      {
        error: errorMessage,
        to,
        type: data.type,
      },
      'Failed to send SMS'
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Send schedule change alert
export async function sendScheduleChangeAlert(
  phoneNumber: string,
  data: Omit<ScheduleChangeNotification, 'type'>,
  language?: Language
): Promise<SMSResult> {
  return sendSMS({
    to: phoneNumber,
    data: {
      type: 'schedule_change',
      ...data,
    },
    language,
  });
}

// Send emergency notification
export async function sendEmergencyNotification(
  phoneNumber: string,
  data: Omit<EmergencyNotification, 'type'>,
  language?: Language
): Promise<SMSResult> {
  return sendSMS({
    to: phoneNumber,
    data: {
      type: 'emergency',
      ...data,
    },
    language,
  });
}

// Send clock in confirmation
export async function sendClockInConfirmation(
  phoneNumber: string,
  data: Omit<ClockInOutConfirmation, 'type'>,
  language?: Language
): Promise<SMSResult> {
  return sendSMS({
    to: phoneNumber,
    data: {
      type: 'clock_in',
      ...data,
    },
    language,
  });
}

// Send clock out confirmation
export async function sendClockOutConfirmation(
  phoneNumber: string,
  data: Omit<ClockInOutConfirmation, 'type'>,
  language?: Language
): Promise<SMSResult> {
  return sendSMS({
    to: phoneNumber,
    data: {
      type: 'clock_out',
      ...data,
    },
    language,
  });
}

// Bulk send to multiple recipients
export interface BulkSMSOptions {
  recipients: Array<{
    phoneNumber: string;
    language?: Language;
  }>;
  data: NotificationData;
}

export async function sendBulkSMS(options: BulkSMSOptions): Promise<SMSResult[]> {
  const { recipients, data } = options;

  logger.info({ count: recipients.length, type: data.type }, 'Sending bulk SMS notifications');

  // Send all messages in parallel
  const promises = recipients.map((recipient) =>
    sendSMS({
      to: recipient.phoneNumber,
      data,
      language: recipient.language,
    })
  );

  const results = await Promise.allSettled(promises);

  return results.map((result) =>
    result.status === 'fulfilled' ? result.value : { success: false, error: 'Promise rejected' }
  );
}

// Check if SMS service is configured
export function isSMSServiceConfigured(): boolean {
  return !!(accountSid && authToken && fromNumber);
}

// Export for testing
export const testUtils = {
  templatesEN,
  templatesES,
  getTemplates,
};
