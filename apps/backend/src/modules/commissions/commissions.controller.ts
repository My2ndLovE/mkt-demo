import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { QueryCommissionsDto } from './dto/query-commissions.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Commissions')
@ApiBearerAuth()
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Query commissions with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Commissions retrieved successfully' })
  async findAll(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: string,
    @Query() queryCommissionsDto: QueryCommissionsDto,
  ) {
    return this.commissionsService.findAll(userId, userRole, queryCommissionsDto);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get commission statistics' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'You can only view your own statistics' })
  async getStats(
    @CurrentUser('id') requesterId: number,
    @CurrentUser('role') requesterRole: string,
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
  ) {
    return this.commissionsService.getStats(requesterId, requesterRole, userId);
  }
}
