import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { del } from '@vercel/blob';

import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class FoldersService {
  constructor(
    private prisma: PrismaService,
    private spaces: SpacesService,
    private sync: SyncService,
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

    const folder = await this.prisma.folder.create({ data: { name, spaceId, parentId } });
    this.sync.emitToSpace(spaceId, 'folder.created');
    return folder;
  }

  async rename(id: string, spaceId: string, userId: string, name: string) {
    await this.spaces.assertWriteAccess(spaceId, userId);

    const folder = await this.prisma.folder.findFirst({ where: { id, spaceId } });
    if (!folder) throw new NotFoundException('Folder not found');

    const conflict = await this.prisma.folder.findFirst({
      where: { spaceId, parentId: folder.parentId, name, id: { not: id } },
    });
    if (conflict) throw new BadRequestException('A folder with that name already exists here');

    const renamed = await this.prisma.folder.update({
      where: { id },
      data: { name },
      include: { _count: { select: { children: true, files: true } } },
    });
    this.sync.emitToSpace(spaceId, 'folder.renamed');
    return renamed;
  }

  async getAncestors(spaceId: string, userId: string, folderId: string) {
    await this.spaces.assertReadAccess(spaceId, userId);
    const path: { id: string; name: string }[] = [];
    let current = await this.prisma.folder.findFirst({ where: { id: folderId, spaceId } });
    while (current) {
      path.unshift({ id: current.id, name: current.name });
      if (!current.parentId) break;
      current = await this.prisma.folder.findFirst({ where: { id: current.parentId, spaceId } });
    }
    return path;
  }

  async getStats(id: string, spaceId: string, userId: string) {
    await this.spaces.assertReadAccess(spaceId, userId);
    const folder = await this.prisma.folder.findFirst({ where: { id, spaceId } });
    if (!folder) throw new NotFoundException('Folder not found');
    return this.getTreeStats(id);
  }

  async move(id: string, spaceId: string, userId: string, parentId: string | null) {
    await this.spaces.assertWriteAccess(spaceId, userId);
    if (id === parentId) throw new BadRequestException('Cannot move a folder into itself');

    const folder = await this.prisma.folder.findFirst({ where: { id, spaceId } });
    if (!folder) throw new NotFoundException('Folder not found');

    if (parentId) {
      const target = await this.prisma.folder.findFirst({ where: { id: parentId, spaceId } });
      if (!target) throw new NotFoundException('Target folder not found');
      let cur = target;
      while (cur.parentId) {
        if (cur.parentId === id)
          throw new BadRequestException('Cannot move a folder into its own descendant');
        cur = await this.prisma.folder.findFirst({ where: { id: cur.parentId } });
      }
    }

    const moved = await this.prisma.folder.update({
      where: { id },
      data: { parentId },
      include: { _count: { select: { children: true, files: true } } },
    });
    this.sync.emitToSpace(spaceId, 'folder.moved');
    return moved;
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
    this.sync.emitToSpace(spaceId, 'folder.deleted');
  }

  async getTreeStats(folderId: string): Promise<{ fileCount: number; folderCount: number }> {
    const [fileCount, children] = await Promise.all([
      this.prisma.file.count({ where: { folderId } }),
      this.prisma.folder.findMany({ where: { parentId: folderId }, select: { id: true } }),
    ]);

    const childStats = await Promise.all(children.map((c) => this.getTreeStats(c.id)));

    return childStats.reduce(
      (acc, s) => ({
        fileCount: acc.fileCount + s.fileCount,
        folderCount: acc.folderCount + s.folderCount + 1,
      }),
      { fileCount, folderCount: 0 },
    );
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
