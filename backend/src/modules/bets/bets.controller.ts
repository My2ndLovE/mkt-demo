import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BetsService } from './bets.service';
import {
  PlaceBetDto,
  CreateBetResponseDto,
  QueryBetDto,
  BetListResponseDto,
  BetDetailsDto,
} from './dtos';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/**
 * Bets Controller
 *
 * Handles HTTP requests for lottery betting operations.
 *
 * Endpoints:
 * - POST /bets - Place a bet
 * - GET /bets - List my bets (with filtering)
 * - GET /bets/:id - Get bet details
 * - DELETE /bets/:id - Cancel a bet
 * - GET /bets/receipt/:receiptNumber - Get bet by receipt number
 *
 * All endpoints require JWT authentication.
 */
@ApiTags('Bets')
@ApiBearerAuth()
@Controller('bets')
@UseGuards(JwtAuthGuard)
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  /**
   * Place a bet (T051-T061)
   *
   * Authenticated agents can place bets with one or more providers.
   * Implements complete bet placement flow with validation, limit checking,
   * and receipt generation.
   *
   * @param dto - Bet placement data
   * @param req - Express request (contains authenticated user)
   * @returns Bet receipt with details
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place a bet (User Story 1)' })
  @ApiResponse({
    status: 201,
    description: 'Bet placed successfully',
    type: CreateBetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or invalid bet data',
  })
  @ApiResponse({
    status: 403,
    description: 'Weekly limit exceeded',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found',
  })
  async placeBet(
    @Body() dto: PlaceBetDto,
    // TODO: Replace with actual CurrentUser decorator when auth is implemented
    // @CurrentUser('userId') agentId: number,
  ): Promise<CreateBetResponseDto> {
    // TEMPORARY: Hardcoded agent ID for development
    // Replace with actual user ID from JWT token
    const agentId = 1;

    return this.betsService.placeBet(agentId, dto);
  }

  /**
   * List my bets (T065-T066)
   *
   * Get paginated list of bets with optional filtering by status, game type, and date range.
   * Agents see only their own bets.
   * Moderators see all bets under their organization.
   *
   * @param query - Query parameters for filtering and pagination
   * @param req - Express request (contains authenticated user)
   * @returns Paginated bet list
   */
  @Get()
  @ApiOperation({ summary: 'List my bets with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Bets retrieved successfully',
    type: BetListResponseDto,
  })
  async findAll(
    @Query() query: QueryBetDto,
    // TODO: Replace with actual CurrentUser decorator
    // @CurrentUser('userId') agentId: number,
    // @CurrentUser('role') role: string,
  ): Promise<BetListResponseDto> {
    // TEMPORARY: Hardcoded values for development
    const agentId = 1;
    const role = 'AGENT';

    return this.betsService.findAll(agentId, query, role);
  }

  /**
   * Get bet details by ID (T067)
   *
   * Get complete bet details including all providers and their statuses.
   *
   * @param id - Bet ID
   * @param req - Express request (contains authenticated user)
   * @returns Bet details
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get bet details by ID' })
  @ApiParam({ name: 'id', description: 'Bet ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Bet details retrieved successfully',
    type: BetDetailsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Bet not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to view this bet',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    // TODO: Replace with actual CurrentUser decorator
    // @CurrentUser('userId') agentId: number,
  ): Promise<BetDetailsDto> {
    // TEMPORARY: Hardcoded agent ID for development
    const agentId = 1;

    return this.betsService.findOne(id, agentId);
  }

  /**
   * Cancel a bet (T062-T064)
   *
   * Cancel a pending bet and refund the weekly limit.
   * Only PENDING bets can be cancelled.
   * Draw date must not have passed.
   *
   * @param id - Bet ID
   * @param req - Express request (contains authenticated user)
   * @returns Updated bet details
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a bet' })
  @ApiParam({ name: 'id', description: 'Bet ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Bet cancelled successfully',
    type: BetDetailsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bet cannot be cancelled (not pending or draw date passed)',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to cancel this bet',
  })
  @ApiResponse({
    status: 404,
    description: 'Bet not found',
  })
  async cancelBet(
    @Param('id', ParseIntPipe) id: number,
    // TODO: Replace with actual CurrentUser decorator
    // @CurrentUser('userId') agentId: number,
  ): Promise<BetDetailsDto> {
    // TEMPORARY: Hardcoded agent ID for development
    const agentId = 1;

    return this.betsService.cancelBet(id, agentId);
  }

  /**
   * Get bet by receipt number (T068)
   *
   * Get complete bet details using the receipt number.
   * Useful for bet lookup and verification.
   *
   * @param receiptNumber - Receipt number
   * @param req - Express request (contains authenticated user)
   * @returns Bet details
   */
  @Get('receipt/:receiptNumber')
  @ApiOperation({ summary: 'Get bet by receipt number' })
  @ApiParam({
    name: 'receiptNumber',
    description: 'Receipt number (format: YYYYMMDD-AGENTID-NNNN)',
    example: '20251118-00001-0001',
  })
  @ApiResponse({
    status: 200,
    description: 'Bet details retrieved successfully',
    type: BetDetailsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Bet not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to view this bet',
  })
  async findByReceipt(
    @Param('receiptNumber') receiptNumber: string,
    // TODO: Replace with actual CurrentUser decorator
    // @CurrentUser('userId') agentId: number,
  ): Promise<BetDetailsDto> {
    // TEMPORARY: Hardcoded agent ID for development
    const agentId = 1;

    return this.betsService.findByReceipt(receiptNumber, agentId);
  }
}
