import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * JWT Authentication Guard
 *
 * Protects routes by requiring valid JWT access token.
 * Uses JwtStrategy to validate tokens.
 *
 * @class JwtAuthGuard
 * @extends {AuthGuard('jwt')}
 *
 * @example Usage in controller
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Request() req) {
 *   return req.user; // User loaded by JwtStrategy
 * }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Add custom authentication logic here if needed
    // For example, you could check for additional headers or permissions
    return super.canActivate(context);
  }
}
