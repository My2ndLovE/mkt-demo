import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UserResponseDto } from './dto/user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles('MODERATOR', 'AGENT')
  @ApiOperation({ summary: 'Create new user (Moderator/Agent only)' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: CurrentUserData) {
    return this.usersService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users (filtered by role)' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(@CurrentUser() user: CurrentUserData) {
    return this.usersService.findAll(user.id);
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get user hierarchy tree' })
  @ApiResponse({ status: 200 })
  async getHierarchy(@CurrentUser() user: CurrentUserData) {
    return this.usersService.getHierarchy(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserData) {
    return this.usersService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.usersService.update(id, dto, user.id);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change own password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: CurrentUserData) {
    return this.usersService.changePassword(user.id, dto);
  }
}
