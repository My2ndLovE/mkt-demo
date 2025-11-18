import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  uplineId: number | null;
  moderatorId: number | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Omit<User, 'passwordHash'>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      this.logger.warn(`Login attempt for non-existent user: ${username}`);
      return null;
    }

    if (!user.active) {
      this.logger.warn(`Login attempt for inactive user: ${username}`);
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${username}`);
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT tokens
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      uplineId: user.uplineId,
      moderatorId: user.moderatorId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Remove passwordHash from response
    const { passwordHash, ...userWithoutPassword } = user;

    this.logger.log(`User logged in: ${user.username} (ID: ${user.id})`);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getAccessTokenExpiry(),
      user: userWithoutPassword,
    };
  }

  async refreshAccessToken(refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string; expiresIn: number }> {
    // Verify refresh token exists and not revoked
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenDto.refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (!tokenRecord.user.active) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Generate new access token
    const payload: JwtPayload = {
      sub: tokenRecord.user.id,
      username: tokenRecord.user.username,
      role: tokenRecord.user.role,
      uplineId: tokenRecord.user.uplineId,
      moderatorId: tokenRecord.user.moderatorId,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Access token refreshed for user: ${tokenRecord.user.username}`);

    return {
      accessToken,
      expiresIn: this.getAccessTokenExpiry(),
    };
  }

  async logout(userId: number, refreshToken: string): Promise<void> {
    // Revoke refresh token (verify ownership to prevent unauthorized revocation)
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        userId: userId, // CRITICAL: Verify the token belongs to the user
      },
      data: { revokedAt: new Date() },
    });

    if (result.count === 0) {
      this.logger.warn(`Logout attempt failed: token not found or doesn't belong to user ${userId}`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    this.logger.log(`User ${userId} logged out (refresh token revoked)`);
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    // Generate random refresh token
    const token = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d'),
      },
    );

    // Calculate expiry date
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d');
    const expiresAt = this.calculateExpiryDate(expiresIn);

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  private getAccessTokenExpiry(): number {
    const expiryStr = this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m');
    return this.parseExpiryToSeconds(expiryStr);
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }

  private calculateExpiryDate(expiry: string): Date {
    const seconds = this.parseExpiryToSeconds(expiry);
    return new Date(Date.now() + seconds * 1000);
  }

  async hashPassword(password: string): Promise<string> {
    // bcrypt with cost 12 (recommended for passwords)
    return bcrypt.hash(password, 12);
  }

  async cleanExpiredTokens(): Promise<number> {
    // Clean up expired refresh tokens (called by scheduled job)
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });

    this.logger.log(`Cleaned ${result.count} expired/revoked refresh tokens`);
    return result.count;
  }
}
