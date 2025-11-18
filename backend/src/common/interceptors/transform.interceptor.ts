import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Standard API response interface
 */
export interface ApiResponse<T> {
  /** HTTP status code */
  statusCode: number;

  /** Response timestamp */
  timestamp: string;

  /** Request path */
  path: string;

  /** Response data */
  data: T;

  /** Optional metadata (pagination, etc.) */
  meta?: Record<string, any>;
}

/**
 * Transform Interceptor
 *
 * Transforms all successful responses into a consistent format.
 * Wraps response data in a standard envelope with metadata.
 *
 * Standard response format:
 * ```json
 * {
 *   "statusCode": 200,
 *   "timestamp": "2025-11-18T10:30:00.000Z",
 *   "path": "/api/v1/users",
 *   "data": { ... },
 *   "meta": { ... }
 * }
 * ```
 *
 * Benefits:
 * - Consistent response structure across all endpoints
 * - Easier client-side parsing and error handling
 * - Built-in metadata support for pagination, filtering, etc.
 * - Request traceability via timestamp and path
 *
 * @class TransformInterceptor
 * @implements {NestInterceptor}
 *
 * @example Application in main.ts
 * ```typescript
 * app.useGlobalInterceptors(new TransformInterceptor());
 * ```
 *
 * @example Response transformation
 * ```typescript
 * // Controller returns:
 * return { id: 1, name: 'John' };
 *
 * // Client receives:
 * {
 *   statusCode: 200,
 *   timestamp: "2025-11-18T10:30:00.000Z",
 *   path: "/api/v1/users/1",
 *   data: { id: 1, name: 'John' }
 * }
 * ```
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  /**
   * Intercepts and transforms the response
   *
   * @param {ExecutionContext} context - Execution context
   * @param {CallHandler} next - Call handler for the next interceptor or route handler
   * @returns {Observable<ApiResponse<T>>} Observable of transformed response
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // If data is already wrapped in our format, return as-is
        if (this.isApiResponse(data)) {
          return data;
        }

        // Extract metadata if present
        let responseData = data;
        let meta: Record<string, any> | undefined;

        // Handle pagination metadata
        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          responseData = data.items;
          meta = data.meta;
        }

        // Build standard response
        const apiResponse: ApiResponse<T> = {
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
          path: request.url,
          data: responseData,
        };

        // Include metadata if present
        if (meta) {
          apiResponse.meta = meta;
        }

        return apiResponse;
      }),
    );
  }

  /**
   * Checks if data is already in API response format
   *
   * @param {any} data - Response data
   * @returns {boolean} True if data is already wrapped
   * @private
   */
  private isApiResponse(data: any): data is ApiResponse<any> {
    return (
      data &&
      typeof data === 'object' &&
      'statusCode' in data &&
      'timestamp' in data &&
      'path' in data &&
      'data' in data
    );
  }
}
