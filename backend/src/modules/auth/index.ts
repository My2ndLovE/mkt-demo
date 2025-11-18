/**
 * Authentication Module Exports
 *
 * Central export file for all authentication-related components.
 * This allows for cleaner imports throughout the application.
 *
 * @example
 * ```typescript
 * import { AuthService, JwtAuthGuard, LoginDto } from '@/modules/auth';
 * ```
 */

// Module
export { AuthModule } from './auth.module';

// Services
export { AuthService } from './auth.service';

// Controllers
export { AuthController } from './auth.controller';

// Strategies
export { JwtStrategy, JwtPayload } from './strategies/jwt.strategy';
export { LocalStrategy } from './strategies/local.strategy';

// Guards
export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { LocalAuthGuard } from './guards/local-auth.guard';

// DTOs
export {
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  ChangePasswordDto,
  ChangePasswordResponseDto,
} from './dtos/auth.dto';
