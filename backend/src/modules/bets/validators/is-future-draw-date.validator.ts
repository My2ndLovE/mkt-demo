import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator: IsFutureDrawDate (T253)
 *
 * Validates that the draw date is in the future.
 * Compares the provided date with the current date/time.
 */
@ValidatorConstraint({ name: 'isFutureDrawDate', async: false })
export class IsFutureDrawDate implements ValidatorConstraintInterface {
  validate(drawDate: string, _args: ValidationArguments): boolean {
    if (!drawDate) {
      return false;
    }

    try {
      const drawDateTime = new Date(drawDate);
      const now = new Date();

      // Draw date must be in the future
      return drawDateTime > now;
    } catch (error) {
      // Invalid date format
      return false;
    }
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Draw date must be in the future';
  }
}
