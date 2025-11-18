import { SafeJsonParser } from './safe-json-parser.util';

describe('SafeJsonParser', () => {
  describe('parse', () => {
    it('should parse valid JSON', () => {
      const result = SafeJsonParser.parse('{"key":"value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return default value for invalid JSON', () => {
      const result = SafeJsonParser.parse('invalid json', { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should return default value for null', () => {
      const result = SafeJsonParser.parse(null, { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should return default value for undefined', () => {
      const result = SafeJsonParser.parse(undefined, { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should return default value for empty string', () => {
      const result = SafeJsonParser.parse('', { default: true });
      expect(result).toEqual({ default: true });
    });
  });

  describe('parseArray', () => {
    it('should parse valid JSON array', () => {
      const result = SafeJsonParser.parseArray<string>('["a","b","c"]');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should return empty array for invalid JSON', () => {
      const result = SafeJsonParser.parseArray('invalid json');
      expect(result).toEqual([]);
    });

    it('should return empty array for null', () => {
      const result = SafeJsonParser.parseArray(null);
      expect(result).toEqual([]);
    });

    it('should parse array of objects', () => {
      const result = SafeJsonParser.parseArray<{ id: number }>(
        '[{"id":1},{"id":2}]',
      );
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('parseObject', () => {
    it('should parse valid JSON object', () => {
      const result = SafeJsonParser.parseObject('{"key":"value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('should return null for invalid JSON', () => {
      const result = SafeJsonParser.parseObject('invalid json');
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = SafeJsonParser.parseObject(null);
      expect(result).toBeNull();
    });
  });

  describe('parseObjectWithDefault', () => {
    it('should parse valid JSON object', () => {
      const result = SafeJsonParser.parseObjectWithDefault('{"key":"value"}', {
        default: true,
      });
      expect(result).toEqual({ key: 'value' });
    });

    it('should return default object for invalid JSON', () => {
      const defaultObj = { default: true, value: 123 };
      const result = SafeJsonParser.parseObjectWithDefault(
        'invalid json',
        defaultObj,
      );
      expect(result).toEqual(defaultObj);
    });
  });

  describe('parseStrict', () => {
    it('should parse valid JSON', () => {
      const result = SafeJsonParser.parseStrict('{"key":"value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('should throw error for invalid JSON', () => {
      expect(() => SafeJsonParser.parseStrict('invalid json')).toThrow(
        'Invalid JSON',
      );
    });

    it('should throw error for empty string', () => {
      expect(() => SafeJsonParser.parseStrict('')).toThrow(
        'Cannot parse empty string',
      );
    });
  });

  describe('error logging', () => {
    it('should log error to console for invalid JSON', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      SafeJsonParser.parse('invalid json', null);

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('JSON parse error');

      consoleSpy.mockRestore();
    });

    it('should truncate long input in error log', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const longString = 'x'.repeat(200);

      SafeJsonParser.parse(longString, null);

      expect(consoleSpy).toHaveBeenCalled();
      const loggedInput = consoleSpy.mock.calls[0][2];
      expect(loggedInput.length).toBeLessThanOrEqual(100);

      consoleSpy.mockRestore();
    });
  });
});
