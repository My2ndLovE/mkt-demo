import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Local Authentication Guard
 *
 * Protects login route by validating username/password.
 * Uses LocalStrategy to validate credentials.
 *
 * @class LocalAuthGuard
 * @extends {AuthGuard('local')}
 *
 * @example Usage in controller
 * ```typescript
 * @UseGuards(LocalAuthGuard)
 * @Post('login')
 * async login(@Request() req) {
 *   return this.authService.login(req.user);
 * }
 * ```
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
