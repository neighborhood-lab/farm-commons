/**
 * Password strength validation utilities
 *
 * Provides functions to validate password strength, check against common passwords,
 * calculate strength scores, and provide visual feedback for password requirements.
 */

/**
 * Common passwords list (top 100 most commonly used passwords)
 * Source: Compiled from various password breach databases
 */
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', '12345678', '12345', '1234567',
  'password1', '123123', '1234567890', 'qwerty', 'abc123', '111111',
  'password123', 'iloveyou', 'welcome', 'monkey', '1234', 'dragon',
  'master', '123321', 'letmein', '1q2w3e4r', 'qwertyuiop', 'admin',
  'sunshine', 'princess', 'login', 'solo', 'starwars', 'football',
  'shadow', 'password!', '654321', 'superman', 'michael', 'charlie',
  'aa123456', 'donald', 'baseball', 'bailey', 'welcome1', 'soccer',
  'freedom', 'whatever', 'trustno1', 'jordan', 'summer', 'ashley',
  'passw0rd', 'hello', 'ranger', 'hunter', 'joshua', 'password12',
  'master1', 'test', 'nicole', 'daniel', 'liverpool', 'jessica',
  'thomas', 'robert', 'online', 'marina', 'hockey', 'jordan23',
  'password1234', 'ginger', 'pepper', 'buster', 'michelle', 'tigger',
  'andrew', 'andrea', '123qwe', 'flower', 'computer', 'harley',
  'cookie', 'london', 'cheese', 'maverick', 'martin', 'jennifer',
  'killer', 'summer1', 'hello123', 'batman', 'george', 'starter',
  'access', 'password!1', 'zaq1zaq1', 'qazwsx', '1qaz2wsx', 'adminadmin'
];

/**
 * Password strength levels
 */
export enum PasswordStrength {
  VERY_WEAK = 0,
  WEAK = 1,
  FAIR = 2,
  STRONG = 3,
  VERY_STRONG = 4,
}

/**
 * Password strength labels for UI display
 */
export const PASSWORD_STRENGTH_LABELS: Record<PasswordStrength, string> = {
  [PasswordStrength.VERY_WEAK]: 'Very Weak',
  [PasswordStrength.WEAK]: 'Weak',
  [PasswordStrength.FAIR]: 'Fair',
  [PasswordStrength.STRONG]: 'Strong',
  [PasswordStrength.VERY_STRONG]: 'Very Strong',
};

/**
 * Password strength colors for visual indicators
 */
export const PASSWORD_STRENGTH_COLORS: Record<PasswordStrength, string> = {
  [PasswordStrength.VERY_WEAK]: '#dc2626', // red-600
  [PasswordStrength.WEAK]: '#f97316', // orange-500
  [PasswordStrength.FAIR]: '#eab308', // yellow-500
  [PasswordStrength.STRONG]: '#22c55e', // green-500
  [PasswordStrength.VERY_STRONG]: '#16a34a', // green-600
};

/**
 * Password validation requirements
 */
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

/**
 * Default password requirements
 */
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Password strength result
 */
export interface PasswordStrengthResult {
  /** Strength score (0-4) */
  score: PasswordStrength;
  /** Human-readable strength label */
  label: string;
  /** Color for visual indicator */
  color: string;
  /** Whether password meets minimum requirements */
  meetsRequirements: boolean;
  /** Feedback messages for the user */
  feedback: string[];
  /** Percentage for progress bar (0-100) */
  percentage: number;
}

/**
 * Check if password contains uppercase letters
 */
function hasUppercase(password: string): boolean {
  return /[A-Z]/.test(password);
}

/**
 * Check if password contains lowercase letters
 */
function hasLowercase(password: string): boolean {
  return /[a-z]/.test(password);
}

/**
 * Check if password contains numbers
 */
function hasNumbers(password: string): boolean {
  return /\d/.test(password);
}

/**
 * Check if password contains special characters
 */
function hasSpecialChars(password: string): boolean {
  return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
}

/**
 * Check if password is in the common passwords list
 */
export function isCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  return COMMON_PASSWORDS.includes(lowerPassword);
}

/**
 * Calculate password strength score
 *
 * @param password - Password to evaluate
 * @returns Strength score from 0-4
 */
export function calculatePasswordScore(password: string): PasswordStrength {
  if (!password) {
    return PasswordStrength.VERY_WEAK;
  }

  let score = 0;

  // Length contribution
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character variety contribution
  if (hasUppercase(password) && hasLowercase(password)) score++;
  if (hasNumbers(password)) score++;
  if (hasSpecialChars(password)) score++;

  // Penalize common passwords
  if (isCommonPassword(password)) {
    score = Math.max(0, score - 2);
  }

  // Penalize repeated characters (e.g., "aaaa", "1111")
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
  }

  // Penalize simple sequential patterns (e.g., "1234", "abcd")
  if (/(?:abc|bcd|cde|def|123|234|345|456|567|678|789)/i.test(password)) {
    score = Math.max(0, score - 1);
  }

  // Cap at maximum strength
  return Math.min(score, PasswordStrength.VERY_STRONG) as PasswordStrength;
}

/**
 * Check if password meets minimum requirements
 *
 * @param password - Password to validate
 * @param requirements - Requirements to check against (defaults to DEFAULT_PASSWORD_REQUIREMENTS)
 * @returns Object with meetsRequirements boolean and failed requirement details
 */
export function checkPasswordRequirements(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): { meetsRequirements: boolean; failedRequirements: string[] } {
  const failedRequirements: string[] = [];

  if (password.length < requirements.minLength) {
    failedRequirements.push(`At least ${requirements.minLength} characters`);
  }

  if (requirements.requireUppercase && !hasUppercase(password)) {
    failedRequirements.push('At least one uppercase letter');
  }

  if (requirements.requireLowercase && !hasLowercase(password)) {
    failedRequirements.push('At least one lowercase letter');
  }

  if (requirements.requireNumbers && !hasNumbers(password)) {
    failedRequirements.push('At least one number');
  }

  if (requirements.requireSpecialChars && !hasSpecialChars(password)) {
    failedRequirements.push('At least one special character');
  }

  return {
    meetsRequirements: failedRequirements.length === 0,
    failedRequirements,
  };
}

/**
 * Validate password strength and return detailed feedback
 *
 * @param password - Password to validate
 * @param requirements - Requirements to check against (defaults to DEFAULT_PASSWORD_REQUIREMENTS)
 * @returns Detailed password strength result
 */
export function validatePasswordStrength(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordStrengthResult {
  const score = calculatePasswordScore(password);
  const { meetsRequirements, failedRequirements } = checkPasswordRequirements(
    password,
    requirements
  );

  const feedback: string[] = [];

  // Add feedback for failed requirements
  if (failedRequirements.length > 0) {
    feedback.push(...failedRequirements);
  }

  // Add feedback for common issues
  if (isCommonPassword(password)) {
    feedback.push('This password is too common - please choose a more unique password');
  }

  if (password && /(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeated characters');
  }

  if (password && /(?:abc|bcd|cde|def|123|234|345|456|567|678|789)/i.test(password)) {
    feedback.push('Avoid sequential patterns');
  }

  // Add positive feedback for strong passwords
  if (meetsRequirements && score >= PasswordStrength.STRONG) {
    feedback.push('Great! Your password is strong');
  }

  return {
    score,
    label: PASSWORD_STRENGTH_LABELS[score],
    color: PASSWORD_STRENGTH_COLORS[score],
    meetsRequirements,
    feedback,
    percentage: (score / PasswordStrength.VERY_STRONG) * 100,
  };
}

/**
 * Generate password strength requirements text for UI display
 *
 * @param requirements - Requirements to display (defaults to DEFAULT_PASSWORD_REQUIREMENTS)
 * @returns Array of requirement strings
 */
export function getPasswordRequirementsText(
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): string[] {
  const texts: string[] = [];

  texts.push(`At least ${requirements.minLength} characters`);

  if (requirements.requireUppercase) {
    texts.push('At least one uppercase letter');
  }

  if (requirements.requireLowercase) {
    texts.push('At least one lowercase letter');
  }

  if (requirements.requireNumbers) {
    texts.push('At least one number');
  }

  if (requirements.requireSpecialChars) {
    texts.push('At least one special character (!@#$%^&*...)');
  }

  return texts;
}
