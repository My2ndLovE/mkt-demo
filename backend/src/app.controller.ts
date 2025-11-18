import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

/**
 * Health status response interface
 */
export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  database?: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
}

/**
 * Application root controller
 *
 * Provides health check endpoints for monitoring and load balancer integration.
 * These endpoints are publicly accessible (no authentication required).
 *
 * @class AppController
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Basic health check endpoint (outside API prefix)
   *
   * This endpoint is available at the root level for simple load balancer checks.
   * Path: GET /health
   *
   * @returns {Promise<HealthStatus>} Basic health status
   * @public
   */
  @Public()
  @Get('health')
  async getHealth(): Promise<HealthStatus> {
    return this.appService.getHealthStatus();
  }

  /**
   * Detailed health check endpoint (within API prefix)
   *
   * This endpoint provides detailed application health information including:
   * - Application status and uptime
   * - Database connectivity and response time
   * - Environment and version information
   *
   * Path: GET /api/v1/health
   *
   * @returns {Promise<HealthStatus>} Detailed health status with database check
   * @public
   */
  @Public()
  @Get('api/v1/health')
  async getDetailedHealth(): Promise<HealthStatus> {
    return this.appService.getDetailedHealthStatus();
  }
}
