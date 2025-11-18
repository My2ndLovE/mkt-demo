import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

/**
 * Local Strategy
 *
 * Passport strategy for validating username/password credentials.
 * Used during login to authenticate users before issuing JWT tokens.
 *
 * @class LocalStrategy
 * @extends {PassportStrategy(Strategy)}
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
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  /**
   * Validate User Credentials
   *
   * Called by Passport to validate username/password.
   * Delegates to AuthService.validateUser() for password verification.
   *
   * @param {string} username - Username
   * @param {string} password - Plain text password
   * @returns {Promise<any>} User object (without password hash)
   * @throws {UnauthorizedException} If credentials are invalid
   */
  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }
    return user;
  }
}
