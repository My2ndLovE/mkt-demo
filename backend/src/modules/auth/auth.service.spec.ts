import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  // Mock user data
  const mockUser = {
    id: 1,
    username: 'testuser',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz', // Mock bcrypt hash
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
    lastLoginAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockFirstLoginUser = {
    ...mockUser,
    id: 2,
    username: 'firsttimeuser',
    firstLogin: true,
  };

  const mockRefreshToken = {
    id: 1,
    userId: 1,
    token: 'valid-refresh-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    revokedAt: null,
    replacedBy: null,
    user: mockUser,
  };

  // Mock Prisma Service
  const mockPrismaService = {
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
  };

  // Mock JWT Service
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  // Mock Config Service
  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'jwt.secret': 'test-secret',
        'jwt.accessTokenExpiration': '15m',
        'jwt.refreshTokenExpiration': '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const password = 'Test123!';
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.validateUser(mockUser.username, password);

      expect(result).toBeDefined();
      expect(result.username).toBe(mockUser.username);
      expect(result.passwordHash).toBeUndefined();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: mockUser.username },
      });
    });

    it('should return null for non-existent user', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password');

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const inactiveUser = { ...mockUser, active: false };
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(inactiveUser);

      const result = await service.validateUser(mockUser.username, 'password');

      expect(result).toBeNull();
    });

    it('should return null for incorrect password', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const result = await service.validateUser(mockUser.username, 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      jest
        .spyOn(mockPrismaService.user, 'findUnique')
        .mockRejectedValue(new Error('Database error'));

      const result = await service.validateUser(mockUser.username, 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should login normal user successfully', async () => {
      jest.spyOn(mockPrismaService.refreshToken, 'create').mockResolvedValue(mockRefreshToken);
      jest.spyOn(mockPrismaService.user, 'update').mockResolvedValue(mockUser);

      const result = await service.login(mockUser);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.requirePasswordChange).toBe(false);
      expect(result.user.username).toBe(mockUser.username);
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should login first-time user with requirePasswordChange=true', async () => {
      jest.spyOn(mockPrismaService.refreshToken, 'create').mockResolvedValue({
        ...mockRefreshToken,
        userId: mockFirstLoginUser.id,
      });
      jest.spyOn(mockPrismaService.user, 'update').mockResolvedValue(mockFirstLoginUser);

      const result = await service.login(mockFirstLoginUser);

      expect(result.requirePasswordChange).toBe(true);
      expect(result.user.username).toBe(mockFirstLoginUser.username);
    });

    it('should throw BadRequestException on error', async () => {
      jest.spyOn(mockPrismaService.refreshToken, 'create').mockRejectedValue(new Error('DB error'));

      await expect(service.login(mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      jest.spyOn(mockPrismaService.refreshToken, 'findUnique').mockResolvedValue(mockRefreshToken);
      jest.spyOn(mockPrismaService.refreshToken, 'create').mockResolvedValue({
        ...mockRefreshToken,
        token: 'new-refresh-token',
      });
      jest.spyOn(mockPrismaService.refreshToken, 'update').mockResolvedValue(mockRefreshToken);

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockRefreshToken.id },
        data: {
          revokedAt: expect.any(Date),
          replacedBy: expect.any(String),
        },
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jest.spyOn(mockPrismaService.refreshToken, 'findUnique').mockResolvedValue(null);

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };
      jest.spyOn(mockPrismaService.refreshToken, 'findUnique').mockResolvedValue(expiredToken);

      await expect(service.refreshTokens('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      const revokedToken = {
        ...mockRefreshToken,
        revokedAt: new Date(),
      };
      jest.spyOn(mockPrismaService.refreshToken, 'findUnique').mockResolvedValue(revokedToken);

      await expect(service.refreshTokens('revoked-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const tokenWithInactiveUser = {
        ...mockRefreshToken,
        user: { ...mockUser, active: false },
      };
      jest
        .spyOn(mockPrismaService.refreshToken, 'findUnique')
        .mockResolvedValue(tokenWithInactiveUser);

      await expect(service.refreshTokens('token-inactive-user')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      jest.spyOn(mockPrismaService.refreshToken, 'findUnique').mockResolvedValue(mockRefreshToken);
      jest.spyOn(mockPrismaService.refreshToken, 'update').mockResolvedValue({
        ...mockRefreshToken,
        revokedAt: new Date(),
      });

      const result = await service.logout('valid-refresh-token');

      expect(result.message).toBe('Logged out successfully');
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockRefreshToken.id },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jest.spyOn(mockPrismaService.refreshToken, 'findUnique').mockResolvedValue(null);

      await expect(service.logout('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException on database error', async () => {
      jest.spyOn(mockPrismaService.refreshToken, 'findUnique').mockResolvedValue(mockRefreshToken);
      jest.spyOn(mockPrismaService.refreshToken, 'update').mockRejectedValue(new Error('DB error'));

      await expect(service.logout('valid-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully and set firstLogin to false', async () => {
      const oldPassword = 'OldPass123!';
      const newPassword = 'NewPass456!';
      const userWithFirstLogin = { ...mockUser, firstLogin: true };

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(userWithFirstLogin);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('new-hash'));
      jest.spyOn(mockPrismaService.user, 'update').mockResolvedValue({
        ...userWithFirstLogin,
        passwordHash: 'new-hash',
        firstLogin: false,
      });
      jest.spyOn(mockPrismaService.refreshToken, 'updateMany').mockResolvedValue({ count: 2 });

      const result = await service.changePassword(mockUser.id, oldPassword, newPassword);

      expect(result.message).toBe('Password changed successfully');
      expect(result.firstLoginUpdated).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          passwordHash: 'new-hash',
          firstLogin: false,
        },
      });
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      });
    });

    it('should change password for user with firstLogin=false', async () => {
      const oldPassword = 'OldPass123!';
      const newPassword = 'NewPass456!';

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('new-hash'));
      jest.spyOn(mockPrismaService.user, 'update').mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hash',
      });
      jest.spyOn(mockPrismaService.refreshToken, 'updateMany').mockResolvedValue({ count: 1 });

      const result = await service.changePassword(mockUser.id, oldPassword, newPassword);

      expect(result.message).toBe('Password changed successfully');
      expect(result.firstLoginUpdated).toBe(false);
    });

    it('should throw UnauthorizedException for user not found', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.changePassword(999, 'OldPass123!', 'NewPass456!')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for incorrect old password', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(
        service.changePassword(mockUser.id, 'WrongPass123!', 'NewPass456!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when new password is same as old', async () => {
      const password = 'SamePass123!';

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      await expect(service.changePassword(mockUser.id, password, password)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException on database error', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('new-hash'));
      jest.spyOn(mockPrismaService.user, 'update').mockRejectedValue(new Error('DB error'));

      await expect(
        service.changePassword(mockUser.id, 'OldPass123!', 'NewPass456!'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'TestPassword123!';
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed-password'));

      const result = await service.hashPassword(password);

      expect(result).toBe('hashed-password');
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });
  });
});
