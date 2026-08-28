import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { User } from '@prisma/client';
import { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateShareDto } from './dto/create-share.dto';
import { SharesService } from './shares.service';

@Controller('shares')
export class SharesController {
  constructor(private shares: SharesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateShareDto) {
    return this.shares.create(user.id, dto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Get('resolve/:token')
  resolveToken(@Param('token') token: string, @Query('email') email?: string) {
    return this.shares.resolveToken(token, email);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Get('resolve/:token/folders')
  browseFolders(
    @Param('token') token: string,
    @Query('parentId') parentId?: string,
    @Query('email') email?: string,
  ) {
    return this.shares.browseFolders(token, parentId, email);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Get('resolve/:token/files')
  browseFiles(
    @Param('token') token: string,
    @Query('folderId') folderId?: string,
    @Query('email') email?: string,
  ) {
    return this.shares.browseFiles(token, folderId, email);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Get('resolve/:token/download/:fileId')
  async downloadFile(
    @Param('token') token: string,
    @Param('fileId') fileId: string,
    @Query('email') email: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, file } = await this.shares.downloadFile(token, fileId, email);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.name)}"`,
    );

    return new StreamableFile(stream);
  }

  @UseGuards(JwtAuthGuard)
  @Get('spaces/:spaceId')
  listForSpace(@Param('spaceId') spaceId: string, @CurrentUser() user: User) {
    return this.shares.listForSpace(spaceId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  revoke(@Param('id') id: string, @CurrentUser() user: User) {
    return this.shares.revoke(id, user.id);
  }
}
