import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { Response } from 'express';
import { memoryStorage } from 'multer';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RenameFileDto } from './dto/rename-file.dto';
import { FilesService } from './files.service';

@Controller('spaces/:spaceId/files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private files: FilesService) {}

  @Get()
  findAll(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Query('folderId') folderId?: string,
  ) {
    return this.files.findAll(spaceId, user.id, folderId);
  }

  @Post()
  @UseInterceptors(
    AnyFilesInterceptor({ storage: memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } }),
  )
  upload(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folderId') folderId?: string,
  ) {
    return this.files.upload(spaceId, user.id, files, folderId);
  }

  @Get(':id/download')
  async download(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query('inline') inline: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, file } = await this.files.download(id, spaceId, user.id);

    res.setHeader('Content-Type', file.mimeType);
    const disposition = inline === 'true' ? 'inline' : 'attachment';
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(file.name)}"`,
    );

    return new StreamableFile(stream);
  }

  @Patch(':id')
  rename(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: RenameFileDto,
  ) {
    return this.files.rename(id, spaceId, user.id, dto.name);
  }

  @Patch(':id/move')
  move(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { folderId: string | null },
  ) {
    return this.files.move(id, spaceId, user.id, body.folderId);
  }

  @Delete(':id')
  remove(@Param('spaceId') spaceId: string, @Param('id') id: string, @CurrentUser() user: User) {
    return this.files.remove(id, spaceId, user.id);
  }
}
