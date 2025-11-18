import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/swagger';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ResultsService } from './results.service';
import { CreateResultDto, UpdateResultDto, QueryResultDto } from './dtos';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Results Controller
 *
 * Manages lottery draw results (T142-T158, T215-T224)
 *
 * Endpoints:
 * - POST /results - Create result (manual entry, admin/moderator)
 * - GET /results - List results (paginated, authenticated)
 * - GET /results/:id - Get result details (authenticated)
 * - PATCH /results/:id - Update result (admin/moderator, before processing)
 * - POST /results/:id/process - Process bets for result (admin/moderator)
 * - POST /results/sync - Manual result sync (admin)
 *
 * Role Access:
 * - Authenticated: View results
 * - Admin/Moderator: Create, update, process results
 */
@ApiTags('results')
@Controller('results')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  /**
   * Create a new draw result (manual entry) (T142)
   * Admin/Moderator only
   */
  @Post()
  @Roles('ADMIN', 'MODERATOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create draw result (manual entry)',
    description: 'Admin/Moderator only. Manually enter a new lottery draw result.',
  })
  @ApiResponse({ status: 201, description: 'Result created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin/moderator only' })
  @ApiResponse({ status: 409, description: 'Conflict - result already exists' })
  create(@Body() createResultDto: CreateResultDto, @CurrentUser() user: any) {
    return this.resultsService.create(createResultDto, user.id);
  }

  /**
   * Get all draw results with filtering (T146)
   * Authenticated users
   */
  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get draw results',
    description: 'Returns paginated list of draw results with optional filtering.',
  })
  @ApiResponse({ status: 200, description: 'Results retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() query: QueryResultDto) {
    return this.resultsService.findAll(query);
  }

  /**
   * Get draw result by ID (T147)
   * Authenticated users
   */
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get draw result by ID',
    description: 'Get detailed information about a specific draw result.',
  })
  @ApiParam({ name: 'id', description: 'Result ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Result retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Result not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.resultsService.findOne(id);
  }

  /**
   * Update draw result (T145)
   * Admin/Moderator only, before processing
   */
  @Patch(':id')
  @Roles('ADMIN', 'MODERATOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update draw result',
    description: 'Admin/Moderator only. Updates a draw result before it has been processed.',
  })
  @ApiParam({ name: 'id', description: 'Result ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Result updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or already processed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin/moderator only' })
  @ApiResponse({ status: 404, description: 'Result not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateResultDto: UpdateResultDto) {
    return this.resultsService.update(id, updateResultDto);
  }

  /**
   * Process all pending bets for a draw result (T151-T158)
   * Admin/Moderator only
   */
  @Post(':id/process')
  @Roles('ADMIN', 'MODERATOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Process bets for draw result',
    description:
      'Admin/Moderator only. Process all pending bets for this draw result, determining winners and calculating commissions.',
  })
  @ApiParam({ name: 'id', description: 'Result ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Bets processed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin/moderator only' })
  @ApiResponse({ status: 404, description: 'Result not found' })
  processBets(@Param('id', ParseIntPipe) id: number) {
    return this.resultsService.processBets(id);
  }

  /**
   * Manual result sync trigger (T215-T224)
   * Admin only
   */
  @Post('sync')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Manually trigger result sync',
    description: 'Admin only. Manually trigger synchronization of results from external API.',
  })
  @ApiResponse({ status: 200, description: 'Sync initiated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  syncResults() {
    // TODO: Implement sync parameters
    return this.resultsService.syncResults('provider-id', '4D', new Date());
  }
}
