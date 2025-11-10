import { format as dateFnsFormat } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import i18n from './i18n';

/**
 * Get the date-fns locale based on the current i18next language
 */
export const getDateFnsLocale = () => {
  const language = i18n.language || 'en';

  const locales: Record<string, Locale> = {
    en: enUS,
    es: es,
  };

  return locales[language] || enUS;
};

/**
 * Format a date with localization support
 * Wraps date-fns format with automatic locale detection
 */
export const formatDate = (date: Date | string | number, formatStr: string = 'PPP') => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return dateFnsFormat(dateObj, formatStr, { locale: getDateFnsLocale() });
};

/**
 * Format a time with localization support
 */
export const formatTime = (date: Date | string | number, formatStr: string = 'p') => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return dateFnsFormat(dateObj, formatStr, { locale: getDateFnsLocale() });
};

/**
 * Format a date and time with localization support
 */
export const formatDateTime = (date: Date | string | number, formatStr: string = 'PPp') => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return dateFnsFormat(dateObj, formatStr, { locale: getDateFnsLocale() });
};
