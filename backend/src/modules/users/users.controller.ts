// NestJS se ye cheezen import ki hain: routes banane, HTTP methods, body/param lena, guards lagana
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
// Role = enum value (@Roles ke liye); User = sirf type (decorator ke saath TS rule ke liye 'import type')
import { Role, type User } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Ye class /users URL ke neeche sab routes handle karti hai
@Controller('users')
// Har route pe pehle JWT check, phir role check — bina login ke koi bhi endpoint nahi chalega
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  // NestJS UsersService ko yahan inject karta hai taake DB wala kaam service se ho
  constructor(private readonly usersService: UsersService) {}

  // POST /users — naya user banata hai; sirf ADMIN
  @Post()
  @Roles(Role.ADMIN)
  create(
    @Body() dto: CreateUserDto,
    // JWT se jo user login hai uska pura record; organizationId multi-tenant ke liye
    @CurrentUser() user: User,
  ) {
    return this.usersService.create(dto, user.organizationId);
  }

  // GET /users — apni org ke saare users ki list
  @Get()
  findAll(@CurrentUser() user: User) {
    return this.usersService.findAll(user.organizationId);
  }

  // GET /users/:id — ek user ka detail (sirf agar wohi org ka ho)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.usersService.findOne(id, user.organizationId);
  }

  // PATCH /users/:id — user update; sirf ADMIN
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    return this.usersService.update(id, dto, user.organizationId);
  }

  // DELETE /users/:id — user delete; sirf ADMIN
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.usersService.remove(id, user.organizationId);
  }
}
