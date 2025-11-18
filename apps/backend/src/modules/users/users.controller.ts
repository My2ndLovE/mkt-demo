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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user (sub-agent)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Username already exists or invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async create(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(userId, userRole, createUserDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Query users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: string,
    @Query() queryUsersDto: QueryUsersDto,
  ) {
    return this.usersService.findAll(userId, userRole, queryUsersDto);
  }

  @Get('hierarchy/tree')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user hierarchy tree (entire downline)' })
  @ApiResponse({ status: 200, description: 'Hierarchy tree retrieved successfully' })
  async getHierarchyTree(@CurrentUser('id') userId: number, @CurrentUser('role') userRole: string) {
    return this.usersService.getHierarchyTree(userId, userRole);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 403, description: 'You can only view your downline users' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @CurrentUser('id') requesterId: number,
    @CurrentUser('role') requesterRole: string,
    @Param('id', ParseIntPipe) userId: number,
  ) {
    return this.usersService.findOne(requesterId, requesterRole, userId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'You can only update your downline users' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @CurrentUser('id') requesterId: number,
    @CurrentUser('role') requesterRole: string,
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(requesterId, requesterRole, userId, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot deactivate yourself' })
  @ApiResponse({ status: 403, description: 'You can only deactivate your downline users' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @CurrentUser('id') requesterId: number,
    @CurrentUser('role') requesterRole: string,
    @Param('id', ParseIntPipe) userId: number,
  ) {
    return this.usersService.remove(requesterId, requesterRole, userId);
  }
}
