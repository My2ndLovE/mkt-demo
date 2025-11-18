import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * FIX M-6: Health Check Endpoint
 * Provides monitoring capabilities for production deployment
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Check system health status including database connectivity',
  })
  @ApiResponse({
    status: 200,
    description: 'System is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2025-01-18T10:00:00.000Z' },
        uptime: { type: 'number', example: 3600 },
        database: { type: 'boolean', example: true },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'System is unhealthy',
  })
  async check() {
    const startTime = Date.now();

    // Check database connectivity
    let dbHealthy = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbHealthy = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    const responseTime = Date.now() - startTime;
    const isHealthy = dbHealthy && responseTime < 5000;

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          healthy: dbHealthy,
          responseTime: `${responseTime}ms`,
        },
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Check if service is ready to accept requests (Kubernetes readiness probe)',
  })
  async ready() {
    try {
      // Check database is ready
      await this.prisma.$queryRaw`SELECT 1`;
      return { ready: true };
    } catch (error) {
      return { ready: false, error: 'Database not ready' };
    }
  }

  @Get('live')
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Check if service is alive (Kubernetes liveness probe)',
  })
  async live() {
    // Simple liveness check - just return if the service is running
    return {
      alive: true,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
