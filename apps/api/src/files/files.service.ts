import { Injectable, NotFoundException } from '@nestjs/common';
import { del, put } from '@vercel/blob';
import { Readable } from 'stream';

import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private spaces: SpacesService,
    private sync: SyncService,
  ) {}

  async upload(spaceId: string, userId: string, files: Express.Multer.File[], folderId?: string) {
    await this.spaces.assertWriteAccess(spaceId, userId);

    if (folderId) {
      const folder = await this.prisma.folder.findFirst({ where: { id: folderId, spaceId } });
      if (!folder) throw new NotFoundException('Folder not found');
    }

    return Promise.all(
      files.map(async (file) => {
        const name = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const blob = await put(`spaces/${spaceId}/${name}`, file.buffer, {
          access: 'private',
          contentType: file.mimetype,
          addRandomSuffix: true,
        });

        const record = await this.prisma.file.create({
          data: {
            name,
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
        this.sync.emitToSpace(spaceId, 'file.created');
        return record;
      }),
    );
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

  async rename(id: string, spaceId: string, userId: string, name: string) {
    await this.spaces.assertWriteAccess(spaceId, userId);

    const file = await this.prisma.file.findFirst({ where: { id, spaceId } });
    if (!file) throw new NotFoundException('File not found');

    // Auto-suffix on sibling name conflict
    const siblings = await this.prisma.file.findMany({
      where: { spaceId, folderId: file.folderId, id: { not: id } },
      select: { name: true },
    });
    const siblingNames = new Set(siblings.map((s) => s.name));

    let finalName = name;
    if (siblingNames.has(name)) {
      const dot = name.lastIndexOf('.');
      const base = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : '';
      let i = 1;
      while (i <= 999 && siblingNames.has(`${base} (${i})${ext}`)) i++;
      finalName = `${base} (${i})${ext}`;
    }

    const updated = await this.prisma.file.update({
      where: { id },
      data: { name: finalName },
      include: { uploadedBy: { select: { id: true, email: true, name: true } } },
    });
    this.sync.emitToSpace(spaceId, 'file.renamed');
    return updated;
  }

  async move(id: string, spaceId: string, userId: string, folderId: string | null) {
    await this.spaces.assertWriteAccess(spaceId, userId);
    const file = await this.prisma.file.findFirst({ where: { id, spaceId } });
    if (!file) throw new NotFoundException('File not found');
    if (folderId) {
      const folder = await this.prisma.folder.findFirst({ where: { id: folderId, spaceId } });
      if (!folder) throw new NotFoundException('Folder not found');
    }
    const moved = await this.prisma.file.update({
      where: { id },
      data: { folderId },
      include: { uploadedBy: { select: { id: true, email: true, name: true } } },
    });
    this.sync.emitToSpace(spaceId, 'file.moved');
    return moved;
  }

  async remove(id: string, spaceId: string, userId: string) {
    await this.spaces.assertWriteAccess(spaceId, userId);

    const file = await this.prisma.file.findFirst({ where: { id, spaceId } });
    if (!file) throw new NotFoundException('File not found');

    await del(file.url);
    await this.prisma.file.delete({ where: { id } });
    this.sync.emitToSpace(spaceId, 'file.deleted');
  }

  async streamFromBlob(url: string) {
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!response.ok) throw new NotFoundException('File not available in storage');
    return Readable.fromWeb(response.body as any);
  }
}
