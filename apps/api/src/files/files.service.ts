import { Injectable, NotFoundException } from '@nestjs/common';
import { del, put } from '@vercel/blob';
import { Readable } from 'stream';

import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private spaces: SpacesService,
  ) {}

  async upload(spaceId: string, userId: string, file: Express.Multer.File, folderId?: string) {
    await this.spaces.assertWriteAccess(spaceId, userId);

    if (folderId) {
      const folder = await this.prisma.folder.findFirst({ where: { id: folderId, spaceId } });
      if (!folder) throw new NotFoundException('Folder not found');
    }

    const blob = await put(`spaces/${spaceId}/${file.originalname}`, file.buffer, {
      access: 'private',
      contentType: file.mimetype,
      addRandomSuffix: true,
    });

    return this.prisma.file.create({
      data: {
        name: file.originalname,
        url: blob.url,
        size: file.size,
        mimeType: file.mimetype,
        spaceId,
        folderId: folderId ?? null,
        uploadedById: userId,
      },
      include: {
        uploadedBy: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async findAll(spaceId: string, userId: string, folderId?: string) {
    await this.spaces.assertReadAccess(spaceId, userId);

    return this.prisma.file.findMany({
      where: { spaceId, folderId: folderId ?? null },
      include: {
        uploadedBy: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async download(id: string, spaceId: string, userId: string) {
    await this.spaces.assertReadAccess(spaceId, userId);

    const file = await this.prisma.file.findFirst({ where: { id, spaceId } });
    if (!file) throw new NotFoundException('File not found');

    const response = await fetch(file.url, {
      headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });

    if (!response.ok) throw new NotFoundException('File not available in storage');

    return { stream: Readable.fromWeb(response.body as any), file };
  }

  async remove(id: string, spaceId: string, userId: string) {
    await this.spaces.assertWriteAccess(spaceId, userId);

    const file = await this.prisma.file.findFirst({ where: { id, spaceId } });
    if (!file) throw new NotFoundException('File not found');

    await del(file.url);
    await this.prisma.file.delete({ where: { id } });
  }
}
