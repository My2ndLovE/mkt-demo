/**
 * Safe JSON Parser Utility
 * Prevents application crashes from malformed JSON data
 *
 * @module SafeJsonParser
 */

export class SafeJsonParser {
  /**
   * Safely parse JSON with fallback to default value
   * @param json - JSON string to parse
   * @param defaultValue - Value to return if parsing fails
   * @returns Parsed JSON or default value
   */
  static parse<T>(json: string | null | undefined, defaultValue: T): T {
    if (!json) return defaultValue;

    try {
      return JSON.parse(json) as T;
    } catch (error) {
      console.error(
        '[SafeJsonParser] JSON parse error:',
        error instanceof Error ? error.message : 'Unknown error',
        '\nInput:',
        json?.substring(0, 100), // Log first 100 chars only
      );
      return defaultValue;
    }
  }

  /**
   * Safely parse JSON array
   * @param json - JSON string to parse
   * @returns Parsed array or empty array if parsing fails
   */
  static parseArray<T>(json: string | null | undefined): T[] {
    return this.parse<T[]>(json, []);
  }

  /**
   * Safely parse JSON object
   * @param json - JSON string to parse
   * @returns Parsed object or null if parsing fails
   */
  static parseObject<T>(json: string | null | undefined): T | null {
    return this.parse<T | null>(json, null);
  }

  /**
   * Safely parse JSON object with default
   * @param json - JSON string to parse
   * @param defaultValue - Default object to return if parsing fails
   * @returns Parsed object or default object
   */
  static parseObjectWithDefault<T extends object>(
    json: string | null | undefined,
    defaultValue: T,
  ): T {
    return this.parse<T>(json, defaultValue);
  }

  /**
   * Validate and parse JSON (throws on invalid JSON)
   * Use this when you want to explicitly handle errors
   * @param json - JSON string to parse
   * @throws Error if JSON is invalid
   * @returns Parsed JSON
   */
  static parseStrict<T>(json: string): T {
    if (!json) {
      throw new Error('Cannot parse empty string as JSON');
    }

    try {
      return JSON.parse(json) as T;
    } catch (error) {
      throw new Error(
        `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
