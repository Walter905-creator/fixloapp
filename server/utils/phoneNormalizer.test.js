/**
 * Tests for Phone Number E.164 Normalization Utility
 */

const { normalizePhoneToE164, isValidE164Format } = require('./phoneNormalizer');

describe('Phone Normalization - E.164 Format', () => {
  
  describe('isValidE164Format', () => {
    test('should validate correct E.164 format', () => {
      expect(isValidE164Format('+12025551234')).toBe(true);
      expect(isValidE164Format('+14155552671')).toBe(true);
      expect(isValidE164Format('+442071838750')).toBe(true);
      expect(isValidE164Format('+551155256325')).toBe(true);
    });

    test('should reject invalid E.164 formats', () => {
      expect(isValidE164Format('12025551234')).toBe(false); // Missing +
      expect(isValidE164Format('+02025551234')).toBe(false); // Starts with 0
      expect(isValidE164Format('+1')).toBe(false); // Too short
      expect(isValidE164Format('+12345678901234567')).toBe(false); // Too long (>15 digits)
      expect(isValidE164Format('+')).toBe(false); // No digits
      expect(isValidE164Format('')).toBe(false); // Empty
      expect(isValidE164Format(null)).toBe(false); // Null
      expect(isValidE164Format(undefined)).toBe(false); // Undefined
    });
  });

  describe('normalizePhoneToE164', () => {
    
    test('should normalize 10-digit US numbers', () => {
      const result = normalizePhoneToE164('2025551234');
      expect(result.success).toBe(true);
      expect(result.phone).toBe('+12025551234');
      expect(result.error).toBe(null);
      expect(result.original).toBe('2025551234');
    });

    test('should normalize 11-digit US numbers starting with 1', () => {
      const result = normalizePhoneToE164('12025551234');
      expect(result.success).toBe(true);
      expect(result.phone).toBe('+12025551234');
      expect(result.error).toBe(null);
    });

    test('should handle phone numbers with formatting characters', () => {
      const testCases = [
        '(202) 555-1234',
        '202-555-1234',
        '202.555.1234',
        '202 555 1234',
        '1-202-555-1234',
        '1 (202) 555-1234'
      ];

      testCases.forEach(phone => {
        const result = normalizePhoneToE164(phone);
        expect(result.success).toBe(true);
        expect(result.phone).toBe('+12025551234');
      });
    });

    test('should keep valid E.164 numbers unchanged', () => {
      const result = normalizePhoneToE164('+12025551234');
      expect(result.success).toBe(true);
      expect(result.phone).toBe('+12025551234');
    });

    test('should handle international numbers', () => {
      const result = normalizePhoneToE164('+442071838750');
      expect(result.success).toBe(true);
      expect(result.phone).toBe('+442071838750');
    });

    test('should reject empty or null inputs', () => {
      expect(normalizePhoneToE164('').success).toBe(false);
      expect(normalizePhoneToE164(null).success).toBe(false);
      expect(normalizePhoneToE164(undefined).success).toBe(false);
    });

    test('should reject phone numbers that are too short', () => {
      const result = normalizePhoneToE164('123');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });

    test('should reject phone numbers that are too long', () => {
      const result = normalizePhoneToE164('12345678901234567890');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });

    test('should reject phone numbers with no digits', () => {
      const result = normalizePhoneToE164('abc-def-ghij');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No digits found in phone number');
    });

    test('should handle the example from the issue: 12564881814', () => {
      const result = normalizePhoneToE164('12564881814');
      expect(result.success).toBe(true);
      expect(result.phone).toBe('+12564881814');
      expect(result.original).toBe('12564881814');
    });

    test('should reject invalid E.164 format starting with +0', () => {
      const result = normalizePhoneToE164('+02025551234');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid E.164 format');
    });

    test('should handle whitespace in input', () => {
      const result = normalizePhoneToE164('  2025551234  ');
      expect(result.success).toBe(true);
      expect(result.phone).toBe('+12025551234');
    });

    test('should handle numeric input', () => {
      const result = normalizePhoneToE164(2025551234);
      expect(result.success).toBe(true);
      expect(result.phone).toBe('+12025551234');
    });
  });

  describe('Real-world scenarios', () => {
    test('should handle common US phone formats', () => {
      const phones = [
        { input: '415-555-2671', expected: '+14155552671' },
        { input: '(415) 555-2671', expected: '+14155552671' },
        { input: '1-415-555-2671', expected: '+14155552671' },
        { input: '14155552671', expected: '+14155552671' },
        { input: '4155552671', expected: '+14155552671' },
        { input: '+14155552671', expected: '+14155552671' }
      ];

      phones.forEach(({ input, expected }) => {
        const result = normalizePhoneToE164(input);
        expect(result.success).toBe(true);
        expect(result.phone).toBe(expected);
      });
    });

    test('should handle international formats', () => {
      const phones = [
        { input: '+44 20 7183 8750', expected: '+442071838750' },
        { input: '+55 11 5525-6325', expected: '+551155256325' },
        { input: '+81 3-1234-5678', expected: '+81312345678' }
      ];

      phones.forEach(({ input, expected }) => {
        const result = normalizePhoneToE164(input);
        expect(result.success).toBe(true);
        expect(result.phone).toBe(expected);
      });
    });
  });
});
