import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { asyncLocalStorage } from '../../prisma/prisma.service';

/**
 * Context interceptor
 * Injects current user into AsyncLocalStorage for Row-Level Security
 */
@Injectable()
export class ContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user (public route), continue without context
    if (!user) {
      return next.handle();
    }

    // Store user context in AsyncLocalStorage
    const store = {
      userId: user.id,
      role: user.role,
      moderatorId: user.moderatorId,
    };

    // Run the rest of the request handler within this context
    return new Observable((subscriber) => {
      asyncLocalStorage.run(store, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
