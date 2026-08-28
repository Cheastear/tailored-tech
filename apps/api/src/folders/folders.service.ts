import { Injectable, NotFoundException } from '@nestjs/common';
import { del } from '@vercel/blob';

import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';

@Injectable()
export class FoldersService {
  constructor(
    private prisma: PrismaService,
    private spaces: SpacesService,
  ) {}

  async findAll(spaceId: string, userId: string, parentId?: string) {
    await this.spaces.assertReadAccess(spaceId, userId);

    return this.prisma.folder.findMany({
      where: { spaceId, parentId: parentId ?? null },
      include: {
        _count: { select: { children: true, files: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(spaceId: string, userId: string, name: string, parentId?: string) {
    await this.spaces.assertWriteAccess(spaceId, userId);

    if (parentId) {
      const parent = await this.prisma.folder.findFirst({ where: { id: parentId, spaceId } });
      if (!parent) throw new NotFoundException('Parent folder not found');
    }

    return this.prisma.folder.create({ data: { name, spaceId, parentId } });
  }

  async remove(id: string, spaceId: string, userId: string) {
    await this.spaces.assertWriteAccess(spaceId, userId);

    const folder = await this.prisma.folder.findFirst({ where: { id, spaceId } });
    if (!folder) throw new NotFoundException('Folder not found');

    const allFiles = await this.getAllFilesInTree(id);

    if (allFiles.length > 0) {
      await del(allFiles.map((f) => f.url));
    }

    await this.prisma.folder.delete({ where: { id } });
  }

  private async getAllFilesInTree(folderId: string): Promise<{ url: string }[]> {
    const files = await this.prisma.file.findMany({
      where: { folderId },
      select: { url: true },
    });

    const children = await this.prisma.folder.findMany({
      where: { parentId: folderId },
      select: { id: true },
    });

    const nested = await Promise.all(children.map((c) => this.getAllFilesInTree(c.id)));

    return [...files, ...nested.flat()];
  }
}
