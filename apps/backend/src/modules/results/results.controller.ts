import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResultsService } from './results.service';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { QueryResultsDto } from './dto/query-results.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Draw Results')
@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new draw result (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Draw result created successfully' })
  @ApiResponse({ status: 400, description: 'Draw result already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async create(@CurrentUser('id') userId: number, @Body() createResultDto: CreateResultDto) {
    return this.resultsService.create(userId, createResultDto);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Query draw results with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Draw results retrieved successfully' })
  async findAll(@Query() queryResultsDto: QueryResultsDto) {
    return this.resultsService.findAll(queryResultsDto);
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get draw result by ID' })
  @ApiResponse({ status: 200, description: 'Draw result retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Draw result not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.resultsService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update draw result (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Draw result updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Draw result not found' })
  async update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResultDto: UpdateResultDto,
  ) {
    return this.resultsService.update(userId, id, updateResultDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete draw result (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Draw result deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Draw result not found' })
  async remove(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.resultsService.remove(userId, id);
  }
}
