import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFolderDto } from './dto/create-folder.dto';
import { FoldersService } from './folders.service';

@Controller('spaces/:spaceId/folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private folders: FoldersService) {}

  @Get()
  findAll(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Query('parentId') parentId?: string,
  ) {
    return this.folders.findAll(spaceId, user.id, parentId);
  }

  @Post()
  create(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateFolderDto,
  ) {
    return this.folders.create(spaceId, user.id, dto.name, dto.parentId);
  }

  @Delete(':id')
  remove(@Param('spaceId') spaceId: string, @Param('id') id: string, @CurrentUser() user: User) {
    return this.folders.remove(id, spaceId, user.id);
  }
}
