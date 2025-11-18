import { Controller, Post, Get, Body, Query, Param, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BetsService } from './bets.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { QueryBetsDto } from './dto/query-bets.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Bets')
@ApiBearerAuth()
@Controller('bets')
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place a new bet' })
  @ApiResponse({ status: 201, description: 'Bet placed successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient weekly limit or invalid data' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async placeBet(
    @CurrentUser('id') userId: number,
    @Body() createBetDto: CreateBetDto,
  ) {
    return this.betsService.placeBet(userId, createBetDto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending bet' })
  @ApiResponse({ status: 200, description: 'Bet cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Bet cannot be cancelled (not PENDING)' })
  @ApiResponse({ status: 403, description: 'You can only cancel your own bets' })
  @ApiResponse({ status: 404, description: 'Bet not found' })
  async cancelBet(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: string,
    @Param('id', ParseIntPipe) betId: number,
  ) {
    return this.betsService.cancelBet(userId, betId, userRole);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Query bets with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Bets retrieved successfully' })
  async queryBets(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: string,
    @Query() queryBetsDto: QueryBetsDto,
  ) {
    return this.betsService.queryBets(userId, userRole, queryBetsDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get bet by ID' })
  @ApiResponse({ status: 200, description: 'Bet retrieved successfully' })
  @ApiResponse({ status: 403, description: 'You can only view your own bets' })
  @ApiResponse({ status: 404, description: 'Bet not found' })
  async getBetById(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: string,
    @Param('id', ParseIntPipe) betId: number,
  ) {
    return this.betsService.getBetById(userId, userRole, betId);
  }

  @Get('summary/stats')
  @Roles('ADMIN', 'MODERATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get betting statistics (admin/moderator only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getBettingStats(@CurrentUser('id') userId: number, @CurrentUser('role') userRole: string) {
    // TODO: Implement betting statistics
    return {
      message: 'Statistics endpoint - to be implemented',
    };
  }
}
