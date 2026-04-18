import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('用户管理')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '获取用户列表（仅管理员）' })
  @ApiQuery({ name: 'userType', required: false, enum: ['gov_enterprise', 'clothing_factory', 'admin'] })
  @ApiResponse({ status: 200, description: '用户列表', type: [User] })
  async findAll(@Query('userType') userType?: string): Promise<User[]> {
    if (userType) {
      return this.usersService.findByType(userType as any);
    }
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  @ApiResponse({ status: 200, description: '用户详情', type: User })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new Error('用户不存在');
    }
    return user;
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '创建用户（仅管理员）' })
  @ApiResponse({ status: 201, description: '用户创建成功', type: User })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '更新用户信息（仅管理员）' })
  @ApiResponse({ status: 200, description: '用户更新成功', type: User })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '禁用用户（仅管理员）' })
  @ApiResponse({ status: 200, description: '用户禁用成功' })
  async deactivate(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usersService.deactivateUser(id);
  }

  @Put(':id/activate')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '启用用户（仅管理员）' })
  @ApiResponse({ status: 200, description: '用户启用成功' })
  async activate(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usersService.activateUser(id);
  }

  @Get('profile/me')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '用户信息', type: User })
  async getProfile(@Req() req): Promise<User> {
    return this.usersService.findOne(req.user.id);
  }

  @Put('profile/me')
  @ApiOperation({ summary: '更新当前用户信息' })
  @ApiResponse({ status: 200, description: '更新成功', type: User })
  async updateProfile(
    @Req() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }
}