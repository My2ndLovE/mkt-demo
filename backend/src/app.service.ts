import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { HealthStatus } from './app.controller';

/**
 * Application service providing core functionality
 *
 * Handles health checks and system-level operations for the
 * Multi-Level Agent Lottery Sandbox System.
 *
 * @class AppService
 */
@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly startTime: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.startTime = Date.now();
  }

  /**
   * Get basic health status
   *
   * Returns basic application health information without database checks.
   * Used for simple load balancer health probes.
   *
   * @returns {Promise<HealthStatus>} Basic health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      environment: this.configService.get<string>('app.environment', 'development'),
      version: this.configService.get<string>('app.version', '1.0.0'),
    };
  }

  /**
   * Get detailed health status with database connectivity check
   *
   * Performs a database connectivity test and returns comprehensive
   * health information including database status and response time.
   *
   * @returns {Promise<HealthStatus>} Detailed health status
   */
  async getDetailedHealthStatus(): Promise<HealthStatus> {
    const baseStatus = await this.getHealthStatus();

    try {
      // Test database connectivity with a simple query
      const dbStartTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const dbResponseTime = Date.now() - dbStartTime;

      return {
        ...baseStatus,
        database: {
          status: 'connected',
          responseTime: dbResponseTime,
        },
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);

      return {
        ...baseStatus,
        status: 'error',
        database: {
          status: 'disconnected',
        },
      };
    }
  }
}
