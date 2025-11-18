import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Custom Validation Pipe
 *
 * Validates and transforms incoming request data using class-validator and class-transformer.
 * Extends NestJS's built-in validation with custom error formatting and additional checks.
 *
 * Features:
 * - Automatic DTO transformation using class-transformer
 * - Validation using class-validator decorators
 * - Nested object validation
 * - Custom error message formatting
 * - Whitelist mode (strips unknown properties)
 * - Type transformation
 *
 * @class ValidationPipe
 * @implements {PipeTransform}
 *
 * @example Application in main.ts (global)
 * ```typescript
 * app.useGlobalPipes(new ValidationPipe());
 * ```
 *
 * @example Route-level application
 * ```typescript
 * @Post('users')
 * @UsePipes(new ValidationPipe())
 * async createUser(@Body() createUserDto: CreateUserDto) {
 *   return this.usersService.create(createUserDto);
 * }
 * ```
 *
 * @example DTO with validation decorators
 * ```typescript
 * export class CreateUserDto {
 *   @IsEmail()
 *   @IsNotEmpty()
 *   email: string;
 *
 *   @IsString()
 *   @MinLength(8)
 *   @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
 *   password: string;
 * }
 * ```
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  /**
   * Transforms and validates the incoming value
   *
   * @param {any} value - Incoming value to validate
   * @param {ArgumentMetadata} metadata - Metadata about the argument
   * @returns {Promise<any>} Validated and transformed value
   * @throws {BadRequestException} If validation fails
   */
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    const { metatype } = metadata;

    // Skip validation for primitive types
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Transform plain object to class instance
    const object = plainToInstance(metatype, value, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });

    // Validate the object
    const errors = await validate(object, {
      whitelist: true, // Strip properties without decorators
      forbidNonWhitelisted: true, // Throw error for unknown properties
      skipMissingProperties: false,
      validationError: {
        target: false, // Don't include target in error
        value: false, // Don't include value in error (may contain sensitive data)
      },
    });

    // Throw exception if validation fails
    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: this.formatErrors(errors),
      });
    }

    return object;
  }

  /**
   * Determines if the type should be validated
   *
   * Skips validation for native JavaScript types and built-in objects.
   *
   * @param {Function} metatype - Type to check
   * @returns {boolean} True if type should be validated
   * @private
   */
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * Formats validation errors into a readable structure
   *
   * Recursively processes validation errors including nested objects
   * and returns a structured error object.
   *
   * @param {ValidationError[]} errors - Array of validation errors
   * @returns {Record<string, any>} Formatted error object
   * @private
   */
  private formatErrors(errors: ValidationError[]): Record<string, any> {
    const formattedErrors: Record<string, any> = {};

    errors.forEach((error) => {
      const { property, constraints, children } = error;

      // Handle nested validation errors
      if (children && children.length > 0) {
        formattedErrors[property] = this.formatErrors(children);
      }
      // Handle constraint errors
      else if (constraints) {
        formattedErrors[property] = Object.values(constraints);
      }
    });

    return formattedErrors;
  }
}
