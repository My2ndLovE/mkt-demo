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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { CreateProviderDto, UpdateProviderDto, QueryProviderDto } from './dtos';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Providers Controller
 *
 * Manages lottery service providers (T090-T096)
 *
 * Endpoints:
 * - GET /providers - List active providers (public)
 * - GET /providers/all - List all providers with filters (admin)
 * - GET /providers/:id - Get provider details (authenticated)
 * - POST /providers - Create provider (admin only)
 * - PATCH /providers/:id - Update provider (admin only)
 * - DELETE /providers/:id - Soft delete provider (admin only)
 *
 * Role Access:
 * - Public: Active providers list
 * - Authenticated: Provider details
 * - Admin: Create, update, delete, view all
 */
@ApiTags('providers')
@Controller('providers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  /**
   * Create a new service provider (T090)
   * Admin only
   */
  @Post()
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new service provider',
    description: 'Admin only. Creates a new lottery service provider with encrypted API key.',
  })
  @ApiResponse({ status: 201, description: 'Provider created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 409, description: 'Conflict - provider code already exists' })
  create(@Body() createProviderDto: CreateProviderDto) {
    return this.providersService.create(createProviderDto);
  }

  /**
   * Get active providers (T091)
   * Public endpoint for bet placement
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get active providers',
    description: 'Public endpoint. Returns list of active lottery providers for bet placement.',
  })
  @ApiResponse({ status: 200, description: 'Active providers retrieved successfully' })
  getActiveProviders() {
    return this.providersService.getActiveProviders();
  }

  /**
   * Get all providers with filtering (T091)
   * Admin only
   */
  @Get('all')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all providers with filtering',
    description:
      'Admin only. Returns all providers including inactive ones, with optional filters.',
  })
  @ApiResponse({ status: 200, description: 'Providers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  findAll(@Query() query: QueryProviderDto, @CurrentUser() user: any) {
    // Include decrypted API key only for admins
    const includeApiKey = user.role === 'ADMIN';
    return this.providersService.findAll(query, includeApiKey);
  }

  /**
   * Get provider by ID (T092)
   * Authenticated users
   */
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get provider by ID',
    description: 'Get detailed information about a specific provider.',
  })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({ status: 200, description: 'Provider retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    // Include decrypted API key only for admins
    const includeApiKey = user.role === 'ADMIN';
    return this.providersService.findOne(id, includeApiKey);
  }

  /**
   * Update provider (T093)
   * Admin only
   */
  @Patch(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update service provider',
    description:
      'Admin only. Updates an existing service provider. API key will be re-encrypted if provided.',
  })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({ status: 200, description: 'Provider updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @ApiResponse({ status: 409, description: 'Conflict - provider code already exists' })
  update(@Param('id') id: string, @Body() updateProviderDto: UpdateProviderDto) {
    return this.providersService.update(id, updateProviderDto);
  }

  /**
   * Soft delete provider (T094)
   * Admin only
   */
  @Delete(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete service provider',
    description: 'Admin only. Soft deletes a provider by setting active=false.',
  })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({ status: 200, description: 'Provider deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  remove(@Param('id') id: string) {
    return this.providersService.remove(id);
  }
}
