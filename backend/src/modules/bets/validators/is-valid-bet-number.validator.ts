import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator: IsValidBetNumber (T249-T250)
 *
 * Validates that the bet numbers match the game type format:
 * - 3D: exactly 3 digits
 * - 4D: exactly 4 digits
 * - 5D: exactly 5 digits
 * - 6D: exactly 6 digits
 *
 * All digits must be numeric (0-9).
 */
@ValidatorConstraint({ name: 'isValidBetNumber', async: false })
export class IsValidBetNumber implements ValidatorConstraintInterface {
  validate(numbers: string, args: ValidationArguments): boolean {
    const object = args.object as any;
    const gameType = object.gameType;

    if (!gameType || !numbers) {
      return false;
    }

    // Extract expected digit count from game type (3D -> 3, 4D -> 4, etc.)
    const expectedLength = parseInt(gameType.charAt(0), 10);

    if (isNaN(expectedLength)) {
      return false;
    }

    // Validate:
    // 1. Numbers is a string of digits only
    // 2. Length matches game type
    const digitPattern = /^\d+$/;
    return digitPattern.test(numbers) && numbers.length === expectedLength;
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as any;
    const gameType = object.gameType;
    const expectedLength = gameType ? parseInt(gameType.charAt(0), 10) : 0;

    return `Numbers must be exactly ${expectedLength} digits for game type ${gameType}`;
  }
}
