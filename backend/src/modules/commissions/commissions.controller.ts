import { Controller, Get, Query, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { QueryCommissionDto } from './dtos';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Commissions Controller
 *
 * Manages commission queries and reporting (T126-T141)
 *
 * Endpoints:
 * - GET /commissions/me - Get my earned commissions (paginated)
 * - GET /commissions/downlines/:userId - Get commissions from specific downline
 * - GET /commissions/stats - Get commission statistics (admin)
 *
 * Note: Commission calculation is done automatically by CommissionsService
 * when bets are processed (not exposed as API endpoint)
 *
 * Role Access:
 * - Authenticated: View own commissions
 * - Admin: View statistics
 */
@ApiTags('commissions')
@Controller('commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  /**
   * Get my earned commissions (T136)
   * Authenticated users
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my earned commissions',
    description: 'Returns paginated list of commissions earned by the current user.',
  })
  @ApiResponse({ status: 200, description: 'Commissions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyCommissions(@CurrentUser() user: any, @Query() query: QueryCommissionDto) {
    return this.commissionsService.getMyCommissions(user.id, query);
  }

  /**
   * Get commissions from specific downline (T137)
   * Authenticated users
   */
  @Get('downlines/:userId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get commissions from specific downline',
    description: 'Returns commissions earned from a specific downline agent.',
  })
  @ApiParam({ name: 'userId', description: 'Downline user ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Commissions retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - not a valid downline' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getDownlineCommissions(
    @CurrentUser() user: any,
    @Param('userId', ParseIntPipe) downlineId: number,
    @Query() query: QueryCommissionDto,
  ) {
    return this.commissionsService.getDownlineCommissions(user.id, downlineId, query);
  }

  /**
   * Get commission statistics (T139)
   * Admin only
   */
  @Get('stats')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get commission statistics',
    description: 'Admin only. Returns aggregate commission statistics for dashboard.',
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  getCommissionStats() {
    return this.commissionsService.getCommissionStats();
  }
}
