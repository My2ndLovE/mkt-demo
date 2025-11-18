# Authentication Module

Complete authentication system with JWT, refresh tokens, password hashing, and first login handling.

## Overview

This module implements secure authentication for the Multi-Level Agent Lottery Sandbox System, covering tasks **T024-T036** (Core Authentication) and **T297-T299** (First Login & Password Change).

## Features

### Core Authentication (T024-T036)
- ✅ JWT Strategy using Passport.js
- ✅ Login endpoint with username/password
- ✅ Refresh token rotation
- ✅ Logout (revoke refresh token)
- ✅ Password hashing with bcrypt (10 rounds minimum)
- ✅ Rate limiting on login endpoint (5 attempts/minute)

### First Login & Password Change (T297-T299)
- ✅ First login flag (`firstLogin` boolean on User model)
- ✅ Force password change on first login
- ✅ Change password endpoint with old password verification
- ✅ Update `firstLogin` flag to false after password change
- ✅ Password complexity validation

## API Endpoints

### POST /auth/login
Login with username and password.

**Request Body:**
```json
{
  "username": "agent001",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6...",
  "requirePasswordChange": false,
  "user": {
    "id": 1,
    "username": "agent001",
    "role": "AGENT",
    "fullName": "John Doe"
  }
}
```

**Rate Limiting:** 5 attempts per minute

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "x7y8z9a0b1c2..."
}
```

### POST /auth/logout
Logout and revoke refresh token.

**Request Body:**
```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### POST /auth/change-password
Change password with old password verification. Requires JWT authentication.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "oldPassword": "OldPassword123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response:**
```json
{
  "message": "Password changed successfully",
  "firstLoginUpdated": true
}
```

## Password Complexity Requirements (T298)

All new passwords must meet the following criteria:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)

## Authentication Flow

### Login Flow
1. User submits username + password
2. Validate credentials against database (bcrypt compare)
3. If first login (`firstLogin=true`), return `requirePasswordChange=true`
4. Generate access token (15min expiry)
5. Generate refresh token (7 days expiry)
6. Store refresh token in database
7. Update `lastLoginAt` timestamp
8. Return tokens + user info

### Refresh Flow
1. Validate refresh token exists and not expired
2. Check token not revoked
3. Generate new access + refresh token pair
4. Revoke old refresh token (set `revokedAt`, store `replacedBy`)
5. Return new tokens

### Change Password Flow (T297-T299)
1. Require access token authentication
2. Validate old password with bcrypt
3. Hash new password (bcrypt, 10 rounds)
4. Update User.passwordHash
5. Set User.firstLogin = false
6. Revoke all existing refresh tokens (force re-login on all devices)
7. Return success

## Security Features

### Token Management
- **Access Tokens:** 15 minute expiry, JWT signed with secret
- **Refresh Tokens:** 7 day expiry, stored in database, cryptographically random
- **Token Rotation:** Old refresh token revoked when new one issued
- **Logout:** Revokes refresh token immediately
- **Password Change:** Revokes ALL refresh tokens for user

### Password Security
- **Hashing:** bcrypt with 10 rounds (configurable)
- **Never stored plaintext:** All passwords hashed before storage
- **Complexity enforcement:** Validated on password change
- **Old password verification:** Required for password changes

### Rate Limiting
- Login endpoint: 5 attempts per minute per IP
- Global rate limit: 100 requests per minute per IP (from AppModule)

## File Structure

```
auth/
├── dtos/
│   └── auth.dto.ts                 # Data Transfer Objects
├── guards/
│   ├── jwt-auth.guard.ts          # JWT authentication guard
│   └── local-auth.guard.ts        # Local (username/password) guard
├── strategies/
│   ├── jwt.strategy.ts            # Passport JWT strategy
│   └── local.strategy.ts          # Passport Local strategy
├── auth.controller.ts             # REST API endpoints
├── auth.service.ts                # Business logic
├── auth.module.ts                 # Module configuration
├── auth.controller.spec.ts        # E2E tests
├── auth.service.spec.ts           # Unit tests
├── index.ts                       # Module exports
└── README.md                      # This file
```

## Usage Examples

### Protecting Routes with JWT Guard

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth';

@Controller('profile')
export class ProfileController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProfile(@Request() req) {
    return req.user; // User loaded by JwtStrategy
  }
}
```

### Using Auth Service

```typescript
import { Injectable } from '@nestjs/common';
import { AuthService } from '@/modules/auth';

@Injectable()
export class UserService {
  constructor(private readonly authService: AuthService) {}

  async createUser(username: string, password: string) {
    const passwordHash = await this.authService.hashPassword(password);
    // Create user with hashed password
  }
}
```

### Checking First Login

```typescript
// After login, check if password change is required
const loginResponse = await authService.login(user);

if (loginResponse.requirePasswordChange) {
  // Redirect to change password page
  // Show message: "Please change your password on first login"
}
```

## Database Schema Changes

Added `firstLogin` field to User model:

```prisma
model User {
  // ... existing fields
  firstLogin      Boolean   @default(true) // T297: Force password change on first login
  // ... existing fields
}
```

**Migration Required:** Run `prisma migrate dev` after pulling this code.

## Environment Variables

Configure in `.env`:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_TOKEN_EXPIRATION=7d
JWT_ISSUER=lottery-sandbox-api
JWT_AUDIENCE=lottery-sandbox-app
```

## Testing

### Run Unit Tests
```bash
npm test -- auth.service.spec
```

### Run E2E Tests
```bash
npm test -- auth.controller.spec
```

### Test Coverage
```bash
npm run test:cov
```

**Coverage Target:** 100% for auth.service.ts

## Test Scenarios Covered

### Login Tests
- ✅ Login success (normal user)
- ✅ Login success (first time user, requirePasswordChange=true)
- ✅ Login failure (wrong password)
- ✅ Login failure (user not found)
- ✅ Login failure (inactive user)
- ✅ Validation errors (missing fields, password too short)

### Refresh Token Tests
- ✅ Refresh token success
- ✅ Refresh token expired
- ✅ Refresh token revoked
- ✅ Refresh token not found
- ✅ User inactive after token issued

### Logout Tests
- ✅ Logout success
- ✅ Logout with invalid token

### Change Password Tests
- ✅ Change password success (sets firstLogin=false)
- ✅ Change password wrong old password
- ✅ Change password weak new password (all complexity rules)
- ✅ Change password same as old
- ✅ Change password for first-time user
- ✅ Validation errors (missing fields, password too short)

## Dependencies

- `@nestjs/jwt` - JWT token generation and validation
- `@nestjs/passport` - Authentication middleware
- `passport` - Authentication library
- `passport-jwt` - JWT authentication strategy
- `bcrypt` - Password hashing
- `@nestjs/throttler` - Rate limiting

## Security Considerations

1. **Never log passwords:** Passwords are not logged anywhere
2. **Token storage:** Refresh tokens stored in database, access tokens client-side only
3. **HTTPS required:** Use HTTPS in production to protect tokens in transit
4. **Secret rotation:** Rotate JWT_SECRET periodically in production
5. **bcrypt rounds:** 10 rounds minimum, increase if server can handle it
6. **Rate limiting:** Prevents brute force attacks on login
7. **Token revocation:** Immediate logout and forced re-login on password change

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Email verification on registration
- [ ] Password reset via email
- [ ] Login history and audit trail
- [ ] Device management (view/revoke sessions)
- [ ] IP whitelisting for admin accounts
- [ ] Biometric authentication support

## Related Tasks

- **T024-T036:** Core Authentication Implementation
- **T297:** First Login Detection
- **T298:** Password Complexity Enforcement
- **T299:** Force Password Change on First Login

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
