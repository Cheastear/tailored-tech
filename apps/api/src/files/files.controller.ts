import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { Response } from 'express';
import { memoryStorage } from 'multer';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Query('folderId') folderId?: string,
  ) {
    return this.files.upload(spaceId, user.id, file, folderId);
  }

  @Get(':id/download')
  async download(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, file } = await this.files.download(id, spaceId, user.id);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);

    return new StreamableFile(stream);
  }

  @Delete(':id')
  remove(@Param('spaceId') spaceId: string, @Param('id') id: string, @CurrentUser() user: User) {
    return this.files.remove(id, spaceId, user.id);
  }
}
