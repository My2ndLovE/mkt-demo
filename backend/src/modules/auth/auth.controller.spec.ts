import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { ThrottlerModule } from '@nestjs/throttler';

describe('AuthController (E2E)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 1,
    username: 'testuser',
    role: 'AGENT',
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    uplineId: null,
    moderatorId: null,
    weeklyLimit: 1000,
    weeklyUsed: 0,
    commissionRate: 5,
    canCreateSubs: true,
    active: true,
    firstLogin: false,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLoginResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    requirePasswordChange: false,
    user: {
      id: 1,
      username: 'testuser',
      role: 'AGENT',
      fullName: 'Test User',
    },
  };

  const mockRefreshResponse = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
  };

  const mockChangePasswordResponse = {
    message: 'Password changed successfully',
    firstLoginUpdated: true,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '15m' },
        }),
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 100,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        LocalStrategy,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'jwt.secret': 'test-secret',
                'jwt.accessTokenExpiration': '15m',
                'jwt.refreshTokenExpiration': '7d',
                'jwt.issuer': 'lottery-sandbox-api',
                'jwt.audience': 'lottery-sandbox-app',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'login').mockResolvedValue(mockLoginResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'Test123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('requirePasswordChange');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
    });

    it('should login first-time user with requirePasswordChange=true', async () => {
      const firstLoginResponse = {
        ...mockLoginResponse,
        requirePasswordChange: true,
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue({
        ...mockUser,
        firstLogin: true,
      });
      jest.spyOn(authService, 'login').mockResolvedValue(firstLoginResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'firsttimeuser',
          password: 'Test123!',
        })
        .expect(200);

      expect(response.body.requirePasswordChange).toBe(true);
    });

    it('should fail login with invalid credentials', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail login with missing username', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'Test123!',
        })
        .expect(400);
    });

    it('should fail login with missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
        })
        .expect(400);
    });

    it('should fail login with password less than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'short',
        })
        .expect(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      jest.spyOn(authService, 'refreshTokens').mockResolvedValue(mockRefreshResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should fail refresh with invalid token', async () => {
      jest
        .spyOn(authService, 'refreshTokens')
        .mockRejectedValue(new Error('Invalid refresh token'));

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(500);
    });

    it('should fail refresh with missing token', async () => {
      await request(app.getHttpServer()).post('/auth/refresh').send({}).expect(400);
    });

    it('should fail refresh with expired token', async () => {
      jest.spyOn(authService, 'refreshTokens').mockRejectedValue(new Error('Token expired'));

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'expired-token',
        })
        .expect(500);
    });

    it('should fail refresh with revoked token', async () => {
      jest.spyOn(authService, 'refreshTokens').mockRejectedValue(new Error('Token revoked'));

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'revoked-token',
        })
        .expect(500);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      jest.spyOn(authService, 'logout').mockResolvedValue({
        message: 'Logged out successfully',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({
          refreshToken: 'valid-refresh-token',
        })
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should fail logout with invalid token', async () => {
      jest.spyOn(authService, 'logout').mockRejectedValue(new Error('Invalid refresh token'));

      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(500);
    });

    it('should fail logout with missing token', async () => {
      await request(app.getHttpServer()).post('/auth/logout').send({}).expect(400);
    });
  });

  describe('POST /auth/change-password', () => {
    const validAccessToken = 'valid-jwt-token';

    beforeEach(() => {
      // Mock JWT verification
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
    });

    it('should change password successfully', async () => {
      jest.spyOn(authService, 'changePassword').mockResolvedValue(mockChangePasswordResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          oldPassword: 'OldPass123!',
          newPassword: 'NewPass456!',
        })
        .expect(200);

      expect(response.body.message).toBe('Password changed successfully');
      expect(response.body.firstLoginUpdated).toBe(true);
    });

    it('should fail without authorization token', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .send({
          oldPassword: 'OldPass123!',
          newPassword: 'NewPass456!',
        })
        .expect(401);
    });

    it('should fail with incorrect old password', async () => {
      jest
        .spyOn(authService, 'changePassword')
        .mockRejectedValue(new Error('Old password is incorrect'));

      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          oldPassword: 'WrongPass123!',
          newPassword: 'NewPass456!',
        })
        .expect(500);
    });

    it('should fail with weak new password (no uppercase)', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          oldPassword: 'OldPass123!',
          newPassword: 'newpass456!', // No uppercase
        })
        .expect(400);
    });

    it('should fail with weak new password (no lowercase)', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          oldPassword: 'OldPass123!',
          newPassword: 'NEWPASS456!', // No lowercase
        })
        .expect(400);
    });

    it('should fail with weak new password (no number)', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          oldPassword: 'OldPass123!',
          newPassword: 'NewPassword!', // No number
        })
        .expect(400);
    });

    it('should fail with weak new password (no special character)', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          oldPassword: 'OldPass123!',
          newPassword: 'NewPass456', // No special character
        })
        .expect(400);
    });

    it('should fail with new password less than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          oldPassword: 'OldPass123!',
          newPassword: 'New1!', // Too short
        })
        .expect(400);
    });

    it('should fail with missing old password', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          newPassword: 'NewPass456!',
        })
        .expect(400);
    });

    it('should fail with missing new password', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          oldPassword: 'OldPass123!',
        })
        .expect(400);
    });
  });
});
