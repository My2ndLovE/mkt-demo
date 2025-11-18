import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message || 'Internal server error',
      error:
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as Record<string, unknown>).error
          : undefined,
    };

    // Log error (in production, send to Application Insights)
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error('Server Error:', exception);
    }

    response.status(status).json(errorResponse);
  }
}
