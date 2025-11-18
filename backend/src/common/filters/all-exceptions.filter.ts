import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Error response interface
 */
interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  stack?: string;
}

/**
 * All Exceptions Filter
 *
 * Global exception filter that catches all exceptions and returns consistent error responses.
 * Handles different types of errors:
 * - HTTP exceptions from NestJS
 * - Prisma database errors
 * - Generic JavaScript errors
 *
 * Features:
 * - Consistent error response format
 * - Detailed logging for debugging
 * - Security: Stack traces only in development
 * - Prisma error translation to HTTP status codes
 * - Request context preservation (path, method, timestamp)
 *
 * @class AllExceptionsFilter
 * @implements {ExceptionFilter}
 *
 * @example Application in main.ts
 * ```typescript
 * app.useGlobalFilters(new AllExceptionsFilter());
 * ```
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /**
   * Catches and handles all exceptions
   *
   * @param {unknown} exception - The thrown exception
   * @param {ArgumentsHost} host - Arguments host for accessing request/response
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | string[];
    let error: string;

    // Handle HTTP exceptions (thrown by NestJS)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.name;
      }
    }
    // Handle Prisma database exceptions
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
      error = 'Database Error';
    }
    // Handle Prisma validation errors
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided';
      error = 'Validation Error';
    }
    // Handle Prisma initialization errors
    else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Database connection failed';
      error = 'Database Connection Error';
    }
    // Handle generic errors
    else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || 'Internal server error';
      error = exception.name || 'Error';
    }
    // Handle unknown errors
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'Unknown Error';
    }

    // Build error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    };

    // Include stack trace only in development mode
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    // Log the error with appropriate level
    const logMessage = `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`;

    if (status >= 500) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : undefined);
    } else if (status >= 400) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }

    // Send error response
    response.status(status).json(errorResponse);
  }

  /**
   * Handles Prisma-specific errors and translates them to HTTP status codes
   *
   * @param {Prisma.PrismaClientKnownRequestError} error - Prisma error
   * @returns {{ status: number; message: string }} HTTP status and message
   * @private
   */
  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (error.code) {
      // Unique constraint violation
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: `Duplicate entry: ${this.extractFieldName(error)} already exists`,
        };

      // Foreign key constraint violation
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Related record not found',
        };

      // Record not found
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
        };

      // Record to delete does not exist
      case 'P2018':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record to delete does not exist',
        };

      // Required field missing
      case 'P2011':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: `Required field missing: ${this.extractFieldName(error)}`,
        };

      // Invalid value for field
      case 'P2006':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: `Invalid value for field: ${this.extractFieldName(error)}`,
        };

      // Default case for other Prisma errors
      default:
        this.logger.error(`Unhandled Prisma error code: ${error.code}`, error.message);
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'A database error occurred',
        };
    }
  }

  /**
   * Extracts field name from Prisma error metadata
   *
   * @param {Prisma.PrismaClientKnownRequestError} error - Prisma error
   * @returns {string} Field name or empty string
   * @private
   */
  private extractFieldName(error: Prisma.PrismaClientKnownRequestError): string {
    if (error.meta && typeof error.meta === 'object') {
      const meta = error.meta as Record<string, any>;
      if (meta.target && Array.isArray(meta.target)) {
        return meta.target.join(', ');
      }
      if (meta.field_name && typeof meta.field_name === 'string') {
        return meta.field_name;
      }
    }
    return '';
  }
}
