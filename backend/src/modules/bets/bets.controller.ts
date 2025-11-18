import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BetsService } from './bets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { CreateBetDto, CancelBetDto, BetResponseDto } from './dto/bet.dto';

@ApiTags('bets')
@Controller('bets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BetsController {
  constructor(private betsService: BetsService) {}

  @Post()
  @ApiOperation({ summary: 'Place a new bet' })
  @ApiResponse({ status: 201, description: 'Bet placed successfully', type: BetResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid bet data' })
  @ApiResponse({ status: 403, description: 'Insufficient weekly limit' })
  async create(@Body() dto: CreateBetDto, @CurrentUser() user: CurrentUserData) {
    return this.betsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get bet history' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'gameType', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, type: [BetResponseDto] })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: string,
    @Query('gameType') gameType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.betsService.findAll(user.id, { status, gameType, startDate, endDate });
  }

  @Get('receipt/:receiptNumber')
  @ApiOperation({ summary: 'Get bet by receipt number' })
  @ApiResponse({ status: 200, type: BetResponseDto })
  @ApiResponse({ status: 404, description: 'Bet not found' })
  async findByReceipt(
    @Param('receiptNumber') receiptNumber: string,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.betsService.findByReceipt(receiptNumber, user.id);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending bet' })
  @ApiResponse({ status: 200, description: 'Bet cancelled successfully', type: BetResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot cancel bet' })
  @ApiResponse({ status: 404, description: 'Bet not found' })
  async cancel(@Body() dto: CancelBetDto, @CurrentUser() user: CurrentUserData) {
    return this.betsService.cancel(dto.receiptNumber, user.id);
  }
}
