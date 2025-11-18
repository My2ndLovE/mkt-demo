import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateServiceProviderDto,
  UpdateServiceProviderDto,
  ServiceProviderResponseDto,
} from './dto/provider.dto';

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all service providers' })
  @ApiResponse({ status: 200, type: [ServiceProviderResponseDto] })
  async findAll(@Query('active') active?: string) {
    const activeOnly = active === 'true';
    return this.providersService.findAll(activeOnly);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get provider by ID' })
  @ApiResponse({ status: 200, type: ServiceProviderResponseDto })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async findOne(@Param('id') id: string) {
    return this.providersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new service provider (Admin only)' })
  @ApiResponse({ status: 201, type: ServiceProviderResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async create(@Body() dto: CreateServiceProviderDto) {
    return this.providersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service provider (Admin only)' })
  @ApiResponse({ status: 200, type: ServiceProviderResponseDto })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceProviderDto) {
    return this.providersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete service provider (Admin only)' })
  @ApiResponse({ status: 204, description: 'Provider deleted' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async delete(@Param('id') id: string) {
    await this.providersService.delete(id);
  }
}
