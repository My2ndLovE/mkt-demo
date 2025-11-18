import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for public routes
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public decorator
 *
 * Marks a route or controller as publicly accessible, bypassing authentication.
 * When applied, the JWT authentication guard will skip token validation for the route.
 *
 * Use this decorator sparingly and only for routes that genuinely need to be public,
 * such as login, registration, health checks, and public API endpoints.
 *
 * @example Route-level public access
 * ```typescript
 * @Post('auth/login')
 * @Public()
 * async login(@Body() loginDto: LoginDto) {
 *   return this.authService.login(loginDto);
 * }
 * ```
 *
 * @example Controller-level public access (all routes public)
 * ```typescript
 * @Controller('public')
 * @Public()
 * export class PublicController {
 *   // All routes in this controller are publicly accessible
 * }
 * ```
 *
 * @example Mixed access in controller
 * ```typescript
 * @Controller('auth')
 * export class AuthController {
 *   @Post('login')
 *   @Public()
 *   async login() { } // Public
 *
 *   @Post('logout')
 *   async logout() { } // Protected (requires authentication)
 * }
 * ```
 *
 * @returns {CustomDecorator} Class or method decorator
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
