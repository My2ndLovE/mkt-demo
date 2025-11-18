import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * Logging Interceptor
 *
 * Logs all incoming HTTP requests and outgoing responses with timing information.
 * Provides detailed request/response logging for debugging and monitoring.
 *
 * Logged information:
 * - HTTP method and URL
 * - Request timestamp
 * - Response time in milliseconds
 * - Response status code
 * - User ID (if authenticated)
 * - Request body (in development mode)
 *
 * @class LoggingInterceptor
 * @implements {NestInterceptor}
 *
 * @example Application in main.ts
 * ```typescript
 * app.useGlobalInterceptors(new LoggingInterceptor());
 * ```
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  /**
   * Intercepts requests to log request/response information
   *
   * @param {ExecutionContext} context - Execution context
   * @param {CallHandler} next - Call handler for the next interceptor or route handler
   * @returns {Observable<any>} Observable of the response
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, query, params } = request;
    const user = (request as any).user;
    const startTime = Date.now();

    // Log incoming request
    const requestLog = [
      `📥 ${method} ${url}`,
      user ? `User: ${user.userId} (${user.role})` : 'User: Anonymous',
    ];

    // Include query parameters if present
    if (Object.keys(query).length > 0) {
      requestLog.push(`Query: ${JSON.stringify(query)}`);
    }

    // Include route parameters if present
    if (Object.keys(params).length > 0) {
      requestLog.push(`Params: ${JSON.stringify(params)}`);
    }

    // Include request body in development mode (exclude sensitive fields)
    if (process.env.NODE_ENV === 'development' && Object.keys(body).length > 0) {
      const sanitizedBody = this.sanitizeBody(body);
      requestLog.push(`Body: ${JSON.stringify(sanitizedBody)}`);
    }

    this.logger.log(requestLog.join(' | '));

    // Handle response and log completion
    return next.handle().pipe(
      tap({
        next: (data: any): void => {
          const responseTime = Date.now() - startTime;
          const response = context.switchToHttp().getResponse();

          this.logger.log(
            `📤 ${method} ${url} | Status: ${response.statusCode} | ` +
              `Time: ${responseTime}ms | ${user ? `User: ${user.userId}` : 'User: Anonymous'}`,
          );
        },
        error: (error: Error): void => {
          const responseTime = Date.now() - startTime;

          this.logger.error(
            `❌ ${method} ${url} | Error: ${error.message} | ` +
              `Time: ${responseTime}ms | ${user ? `User: ${user.userId}` : 'User: Anonymous'}`,
          );
        },
      }),
    );
  }

  /**
   * Sanitizes request body by removing sensitive fields
   *
   * Removes or masks sensitive data like passwords, tokens, and credit card numbers
   * before logging to prevent security leaks.
   *
   * @param {Record<string, any>} body - Request body
   * @returns {Record<string, any>} Sanitized body
   * @private
   */
  private sanitizeBody(body: Record<string, any>): Record<string, any> {
    const sensitiveFields = [
      'password',
      'passwordConfirmation',
      'currentPassword',
      'newPassword',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'creditCard',
      'cvv',
      'pin',
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
