import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateSpaceDto } from './dto/create-space.dto';
import { SpacesService } from './spaces.service';

@Controller('spaces')
@UseGuards(JwtAuthGuard)
export class SpacesController {
  constructor(private spaces: SpacesService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateSpaceDto) {
    return this.spaces.create(user.id, dto.name);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.spaces.findAllForUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.spaces.findOne(id, user.id);
  }

  @Patch(':id')
  rename(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: CreateSpaceDto) {
    return this.spaces.rename(id, user.id, dto.name);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.spaces.remove(id, user.id);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: AddMemberDto) {
    return this.spaces.addMember(id, user.id, dto.email, dto.role);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    return this.spaces.removeMember(id, user.id, userId);
  }
}
