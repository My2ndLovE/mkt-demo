import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ResultsService } from './results.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { CreateDrawResultDto, DrawResultResponseDto } from './dto/result.dto';

@ApiTags('results')
@Controller('results')
export class ResultsController {
  constructor(private resultsService: ResultsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create draw result (Admin/Moderator only)' })
  @ApiResponse({ status: 201, type: DrawResultResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid data or duplicate result' })
  async create(@Body() dto: CreateDrawResultDto, @CurrentUser() user: CurrentUserData) {
    return this.resultsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get draw results' })
  @ApiQuery({ name: 'providerId', required: false })
  @ApiQuery({ name: 'gameType', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, type: [DrawResultResponseDto] })
  async findAll(
    @Query('providerId') providerId?: string,
    @Query('gameType') gameType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.resultsService.findAll({ providerId, gameType, startDate, endDate });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get result by ID' })
  @ApiResponse({ status: 200, type: DrawResultResponseDto })
  @ApiResponse({ status: 404, description: 'Result not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.resultsService.findOne(id);
  }
}
