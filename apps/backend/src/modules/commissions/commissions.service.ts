import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryCommissionsDto } from './dto/query-commissions.dto';
import { createPaginatedResponse, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Query commissions with pagination and filters
   * Row-level security is applied via Prisma middleware
   */
  async findAll(
    requesterId: number,
    requesterRole: string,
    dto: QueryCommissionsDto,
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10, userId, betId, fromDate, toDate } = dto;

    // Build where clause
    const where: any = {};

    // Role-based filtering
    if (requesterRole === 'AGENT') {
      // Agents can only see their own commissions
      where.userId = requesterId;
    } else if (requesterRole === 'MODERATOR') {
      // Moderators can see commissions in their tree (handled by RLS middleware)
      if (userId) {
        where.userId = userId;
      }
    } else if (requesterRole === 'ADMIN') {
      // Admins can see all commissions
      if (userId) {
        where.userId = userId;
      }
    }

    // Apply filters
    if (betId) {
      where.betId = betId;
    }

    if (fromDate || toDate) {
      where.createdAt = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    // Get total count
    const total = await this.prisma.commission.count({ where });

    // Get paginated commissions
    const commissions = await this.prisma.commission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        bet: {
          select: {
            id: true,
            betNumber: true,
            betType: true,
            totalAmount: true,
            drawDate: true,
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return createPaginatedResponse(commissions, total, page, limit);
  }

  /**
   * Get commission statistics for a user
   * Total commissions earned, count, etc.
   */
  async getStats(requesterId: number, requesterRole: string, userId?: number) {
    // Determine which user's stats to fetch
    const targetUserId = userId || requesterId;

    // Permission check
    if (requesterRole === 'AGENT' && targetUserId !== requesterId) {
      throw new ForbiddenException('You can only view your own commission statistics');
    }

    // Get commission statistics
    const stats = await this.prisma.commission.aggregate({
      where: {
        userId: targetUserId,
      },
      _sum: {
        commissionAmount: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        commissionRate: true,
      },
    });

    // Get monthly breakdown (last 12 months)
    const monthlyStats = await this.prisma.$queryRaw<any[]>`
      SELECT
        FORMAT(createdAt, 'yyyy-MM') as month,
        COUNT(*) as count,
        SUM(commissionAmount) as total
      FROM Commission
      WHERE userId = ${targetUserId}
        AND createdAt >= DATEADD(month, -12, GETDATE())
      GROUP BY FORMAT(createdAt, 'yyyy-MM')
      ORDER BY month DESC
    `;

    return {
      totalCommissions: stats._sum.commissionAmount || 0,
      commissionCount: stats._count.id,
      averageRate: stats._avg.commissionRate || 0,
      monthlyBreakdown: monthlyStats,
    };
  }
}
