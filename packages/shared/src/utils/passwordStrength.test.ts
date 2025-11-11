import { describe, it, expect } from 'vitest';
import {
  PasswordStrength,
  PASSWORD_STRENGTH_LABELS,
  PASSWORD_STRENGTH_COLORS,
  DEFAULT_PASSWORD_REQUIREMENTS,
  isCommonPassword,
  calculatePasswordScore,
  checkPasswordRequirements,
  validatePasswordStrength,
  getPasswordRequirementsText,
  type PasswordRequirements,
} from './passwordStrength';

describe('passwordStrength', () => {
  describe('isCommonPassword', () => {
    it('should identify common passwords', () => {
      expect(isCommonPassword('password')).toBe(true);
      expect(isCommonPassword('123456')).toBe(true);
      expect(isCommonPassword('qwerty')).toBe(true);
      expect(isCommonPassword('Password')).toBe(true); // Case insensitive
      expect(isCommonPassword('PASSWORD')).toBe(true); // Case insensitive
    });

    it('should not flag unique passwords as common', () => {
      expect(isCommonPassword('MyUniqueP@ssw0rd123!')).toBe(false);
      expect(isCommonPassword('Tr0ub4dor&3')).toBe(false);
      expect(isCommonPassword('correcthorsebatterystaple')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(isCommonPassword('')).toBe(false);
    });
  });

  describe('calculatePasswordScore', () => {
    it('should return VERY_WEAK for empty password', () => {
      expect(calculatePasswordScore('')).toBe(PasswordStrength.VERY_WEAK);
    });

    it('should score short passwords as weak', () => {
      expect(calculatePasswordScore('abc')).toBeLessThanOrEqual(PasswordStrength.WEAK);
      expect(calculatePasswordScore('12345')).toBeLessThanOrEqual(PasswordStrength.WEAK);
    });

    it('should give higher scores to longer passwords', () => {
      const short = calculatePasswordScore('Abc123!');
      const medium = calculatePasswordScore('Abc123!@#$%');
      const long = calculatePasswordScore('Abc123!@#$%^&*()');

      expect(medium).toBeGreaterThanOrEqual(short);
      expect(long).toBeGreaterThanOrEqual(medium);
    });

    it('should reward character variety', () => {
      const onlyLower = calculatePasswordScore('abcdefgh');
      const withUpper = calculatePasswordScore('Abcdefgh');
      const withNumbers = calculatePasswordScore('Abcdef12');
      const withSpecial = calculatePasswordScore('Abcde1!@');

      expect(withUpper).toBeGreaterThan(onlyLower);
      expect(withNumbers).toBeGreaterThanOrEqual(withUpper);
      expect(withSpecial).toBeGreaterThanOrEqual(withNumbers);
    });

    it('should penalize common passwords', () => {
      const common = calculatePasswordScore('password123');
      const unique = calculatePasswordScore('MyUnique123!');

      expect(unique).toBeGreaterThan(common);
    });

    it('should penalize repeated characters', () => {
      const repeated = calculatePasswordScore('Aaaa1111!!!!');
      const varied = calculatePasswordScore('Abcd1234!@#$');

      expect(varied).toBeGreaterThan(repeated);
    });

    it('should penalize sequential patterns', () => {
      const sequential = calculatePasswordScore('Abc123!@');
      const random = calculatePasswordScore('Afc163!@');

      expect(random).toBeGreaterThanOrEqual(sequential);
    });

    it('should cap score at VERY_STRONG', () => {
      const superLong = 'A'.repeat(100) + 'b1!@#$%^&*()';
      expect(calculatePasswordScore(superLong)).toBeLessThanOrEqual(PasswordStrength.VERY_STRONG);
    });
  });

  describe('checkPasswordRequirements', () => {
    const defaultReqs = DEFAULT_PASSWORD_REQUIREMENTS;

    it('should pass for password meeting all requirements', () => {
      const result = checkPasswordRequirements('MyP@ssw0rd123', defaultReqs);
      expect(result.meetsRequirements).toBe(true);
      expect(result.failedRequirements).toHaveLength(0);
    });

    it('should fail for password too short', () => {
      const result = checkPasswordRequirements('Abc1!', defaultReqs);
      expect(result.meetsRequirements).toBe(false);
      expect(result.failedRequirements).toContain('At least 8 characters');
    });

    it('should fail for password without uppercase', () => {
      const result = checkPasswordRequirements('mypassword1!', defaultReqs);
      expect(result.meetsRequirements).toBe(false);
      expect(result.failedRequirements).toContain('At least one uppercase letter');
    });

    it('should fail for password without lowercase', () => {
      const result = checkPasswordRequirements('MYPASSWORD1!', defaultReqs);
      expect(result.meetsRequirements).toBe(false);
      expect(result.failedRequirements).toContain('At least one lowercase letter');
    });

    it('should fail for password without numbers', () => {
      const result = checkPasswordRequirements('MyPassword!', defaultReqs);
      expect(result.meetsRequirements).toBe(false);
      expect(result.failedRequirements).toContain('At least one number');
    });

    it('should fail for password without special characters', () => {
      const result = checkPasswordRequirements('MyPassword123', defaultReqs);
      expect(result.meetsRequirements).toBe(false);
      expect(result.failedRequirements).toContain('At least one special character');
    });

    it('should list all failed requirements', () => {
      const result = checkPasswordRequirements('abc', defaultReqs);
      expect(result.meetsRequirements).toBe(false);
      expect(result.failedRequirements.length).toBeGreaterThan(1);
    });

    it('should work with custom requirements', () => {
      const customReqs: PasswordRequirements = {
        minLength: 6,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
      };

      const result = checkPasswordRequirements('mypass123', customReqs);
      expect(result.meetsRequirements).toBe(true);
      expect(result.failedRequirements).toHaveLength(0);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should return complete result for valid password', () => {
      const result = validatePasswordStrength('MyStr0ng!Pass');

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('color');
      expect(result).toHaveProperty('meetsRequirements');
      expect(result).toHaveProperty('feedback');
      expect(result).toHaveProperty('percentage');
    });

    it('should indicate when password meets requirements', () => {
      const result = validatePasswordStrength('MyStr0ng!Pass123');
      expect(result.meetsRequirements).toBe(true);
    });

    it('should indicate when password does not meet requirements', () => {
      const result = validatePasswordStrength('weak');
      expect(result.meetsRequirements).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should provide feedback for failed requirements', () => {
      const result = validatePasswordStrength('abc');
      expect(result.feedback).toContain('At least 8 characters');
      expect(result.feedback.length).toBeGreaterThan(1);
    });

    it('should warn about common passwords', () => {
      const result = validatePasswordStrength('password123');
      expect(result.feedback.some(f => f.includes('common'))).toBe(true);
    });

    it('should warn about repeated characters', () => {
      const result = validatePasswordStrength('Aaaa1111!!!!');
      expect(result.feedback.some(f => f.includes('repeated'))).toBe(true);
    });

    it('should warn about sequential patterns', () => {
      const result = validatePasswordStrength('Abc12345!@#');
      expect(result.feedback.some(f => f.includes('sequential'))).toBe(true);
    });

    it('should provide positive feedback for strong passwords', () => {
      const result = validatePasswordStrength('MyV3ry!Str0ng#P@ssw0rd');
      expect(result.meetsRequirements).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(PasswordStrength.STRONG);
      if (result.score >= PasswordStrength.STRONG) {
        expect(result.feedback.some(f => f.includes('Great'))).toBe(true);
      }
    });

    it('should calculate percentage correctly', () => {
      const weak = validatePasswordStrength('abc');
      const strong = validatePasswordStrength('MyV3ry!Str0ng#P@ssw0rd');

      expect(weak.percentage).toBeLessThan(strong.percentage);
      expect(weak.percentage).toBeGreaterThanOrEqual(0);
      expect(weak.percentage).toBeLessThanOrEqual(100);
      expect(strong.percentage).toBeGreaterThanOrEqual(0);
      expect(strong.percentage).toBeLessThanOrEqual(100);
    });

    it('should use correct label from PASSWORD_STRENGTH_LABELS', () => {
      const result = validatePasswordStrength('MyP@ssw0rd123');
      expect(result.label).toBe(PASSWORD_STRENGTH_LABELS[result.score]);
    });

    it('should use correct color from PASSWORD_STRENGTH_COLORS', () => {
      const result = validatePasswordStrength('MyP@ssw0rd123');
      expect(result.color).toBe(PASSWORD_STRENGTH_COLORS[result.score]);
    });
  });

  describe('getPasswordRequirementsText', () => {
    it('should return all requirement texts for default requirements', () => {
      const texts = getPasswordRequirementsText();
      expect(texts).toContain('At least 8 characters');
      expect(texts).toContain('At least one uppercase letter');
      expect(texts).toContain('At least one lowercase letter');
      expect(texts).toContain('At least one number');
      expect(texts.some(t => t.includes('special character'))).toBe(true);
    });

    it('should return custom requirement texts', () => {
      const customReqs: PasswordRequirements = {
        minLength: 12,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
      };

      const texts = getPasswordRequirementsText(customReqs);
      expect(texts).toContain('At least 12 characters');
      expect(texts).toContain('At least one lowercase letter');
      expect(texts).toContain('At least one number');
      expect(texts).not.toContain('At least one uppercase letter');
      expect(texts.some(t => t.includes('special character'))).toBe(false);
    });

    it('should always include length requirement', () => {
      const texts = getPasswordRequirementsText();
      expect(texts.some(t => t.includes('characters'))).toBe(true);
    });
  });

  describe('Password Strength Constants', () => {
    it('should have labels for all strength levels', () => {
      expect(PASSWORD_STRENGTH_LABELS[PasswordStrength.VERY_WEAK]).toBe('Very Weak');
      expect(PASSWORD_STRENGTH_LABELS[PasswordStrength.WEAK]).toBe('Weak');
      expect(PASSWORD_STRENGTH_LABELS[PasswordStrength.FAIR]).toBe('Fair');
      expect(PASSWORD_STRENGTH_LABELS[PasswordStrength.STRONG]).toBe('Strong');
      expect(PASSWORD_STRENGTH_LABELS[PasswordStrength.VERY_STRONG]).toBe('Very Strong');
    });

    it('should have colors for all strength levels', () => {
      expect(PASSWORD_STRENGTH_COLORS[PasswordStrength.VERY_WEAK]).toBeTruthy();
      expect(PASSWORD_STRENGTH_COLORS[PasswordStrength.WEAK]).toBeTruthy();
      expect(PASSWORD_STRENGTH_COLORS[PasswordStrength.FAIR]).toBeTruthy();
      expect(PASSWORD_STRENGTH_COLORS[PasswordStrength.STRONG]).toBeTruthy();
      expect(PASSWORD_STRENGTH_COLORS[PasswordStrength.VERY_STRONG]).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long passwords', () => {
      const veryLong = 'A'.repeat(1000) + 'b1!';
      const result = validatePasswordStrength(veryLong);
      expect(result.score).toBeLessThanOrEqual(PasswordStrength.VERY_STRONG);
    });

    it('should handle passwords with only special characters', () => {
      const specialOnly = '!@#$%^&*()';
      const result = validatePasswordStrength(specialOnly);
      expect(result.meetsRequirements).toBe(false);
    });

    it('should handle Unicode characters gracefully', () => {
      const unicode = 'MyP@ssw0rd123🚀💪';
      const result = validatePasswordStrength(unicode);
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('meetsRequirements');
    });

    it('should handle passwords with spaces', () => {
      const withSpaces = 'My P@ssw0rd 123';
      const result = validatePasswordStrength(withSpaces);
      expect(result).toHaveProperty('score');
    });
  });

  describe('Real-world Password Examples', () => {
    it('should rate weak passwords as weak', () => {
      const weakPasswords = [
        'password',
        '123456',
        'abc123',
        'qwerty',
        'letmein',
      ];

      weakPasswords.forEach(pwd => {
        const result = validatePasswordStrength(pwd);
        expect(result.score).toBeLessThanOrEqual(PasswordStrength.WEAK);
        expect(result.meetsRequirements).toBe(false);
      });
    });

    it('should rate medium passwords as fair to strong', () => {
      const mediumPasswords = [
        'P@ssword123',
        'MyP@ss2024',
        'Welcome!23',
      ];

      mediumPasswords.forEach(pwd => {
        const result = validatePasswordStrength(pwd);
        expect(result.score).toBeGreaterThanOrEqual(PasswordStrength.FAIR);
        expect(result.meetsRequirements).toBe(true);
      });
    });

    it('should rate strong passwords highly', () => {
      const strongPasswords = [
        'MyV3ry!Str0ng#P@ssw0rd',
        'C0rrect-H0rse-B@ttery-St@ple',
        'Tr0ub4dor&3$ecure!P@ss',
      ];

      strongPasswords.forEach(pwd => {
        const result = validatePasswordStrength(pwd);
        expect(result.score).toBeGreaterThanOrEqual(PasswordStrength.STRONG);
        expect(result.meetsRequirements).toBe(true);
      });
    });
  });
});
