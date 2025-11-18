import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LimitsService } from './limits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('limits')
@Controller('limits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LimitsController {
  constructor(private limitsService: LimitsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current user weekly limit balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalance(@CurrentUser() user: CurrentUserData) {
    return this.limitsService.getBalance(user.id);
  }
}
