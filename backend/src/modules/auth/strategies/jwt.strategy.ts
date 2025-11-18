import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: { sub: number; username: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        role: true,
        moderatorId: true,
        fullName: true,
        active: true,
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Set current user in global context for RLS
    (global as Record<string, unknown>).currentUser = {
      id: user.id,
      role: user.role,
      moderatorId: user.moderatorId,
    };

    return user;
  }
}
