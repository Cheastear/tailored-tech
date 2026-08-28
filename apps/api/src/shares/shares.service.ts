import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShareDto } from './dto/create-share.dto';

@Injectable()
export class SharesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateShareDto) {
    const setIds = [dto.spaceId, dto.folderId, dto.fileId].filter(Boolean);
    if (setIds.length !== 1) throw new BadRequestException('Exactly one resource must be specified');

    if (dto.mode === 'PERMISSIONED' && (!dto.allowedEmails || dto.allowedEmails.length === 0)) {
      throw new BadRequestException('Permissioned shares require at least one email');
    }

    const spaceId = await this.resolveOwningSpaceId(dto);
    await this.assertOwnerAccess(spaceId, userId);

    return this.prisma.share.create({
      data: {
        mode: dto.mode,
        resourceType: dto.resourceType,
        spaceId: dto.spaceId ?? null,
        folderId: dto.folderId ?? null,
        fileId: dto.fileId ?? null,
        createdById: userId,
        allowedEmails: dto.allowedEmails ?? [],
      },
      include: { createdBy: { select: { id: true, email: true, name: true } } },
    });
  }

  async resolveToken(token: string, email?: string) {
    const share = await this.prisma.share.findUnique({ where: { token } });
    if (!share || share.revokedAt) throw new NotFoundException('Share not found or revoked');

    if (share.mode === 'PERMISSIONED') {
      const allowed = !!email && share.allowedEmails.includes(email);
      if (!allowed) {
        // Fixed delay makes timing attacks useless regardless of list size
        await new Promise((r) => setTimeout(r, 300));
        throw new ForbiddenException('Access denied');
      }
    }

    return share;
  }

  async browseFolders(token: string, parentId?: string, email?: string) {
    const share = await this.resolveToken(token, email);

    let spaceId: string;
    let resolvedParentId: string | null = null;

    if (share.resourceType === 'SPACE') {
      spaceId = share.spaceId;
      resolvedParentId = parentId ?? null;
      if (parentId) {
        const f = await this.prisma.folder.findFirst({ where: { id: parentId, spaceId } });
        if (!f) throw new NotFoundException('Folder not found');
      }
    } else if (share.resourceType === 'FOLDER') {
      const root = await this.prisma.folder.findUnique({ where: { id: share.folderId } });
      if (!root) throw new NotFoundException('Shared folder not found');
      spaceId = root.spaceId;
      if (!parentId) {
        resolvedParentId = share.folderId;
      } else {
        await this.assertUnderFolder(parentId, share.folderId, spaceId);
        resolvedParentId = parentId;
      }
    } else {
      throw new BadRequestException('Cannot browse folders on a file share');
    }

    return this.prisma.folder.findMany({
      where: { spaceId, parentId: resolvedParentId },
      include: { _count: { select: { children: true, files: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async browseFiles(token: string, folderId?: string, email?: string) {
    const share = await this.resolveToken(token, email);

    let spaceId: string;
    let resolvedFolderId: string | null = null;

    if (share.resourceType === 'SPACE') {
      spaceId = share.spaceId;
      resolvedFolderId = folderId ?? null;
    } else if (share.resourceType === 'FOLDER') {
      const root = await this.prisma.folder.findUnique({ where: { id: share.folderId } });
      if (!root) throw new NotFoundException('Shared folder not found');
      spaceId = root.spaceId;
      if (!folderId) {
        resolvedFolderId = share.folderId;
      } else {
        await this.assertUnderFolder(folderId, share.folderId, spaceId);
        resolvedFolderId = folderId;
      }
    } else {
      // FILE share — return just this file
      const file = await this.prisma.file.findUnique({
        where: { id: share.fileId },
        include: { uploadedBy: { select: { id: true, email: true, name: true } } },
      });
      if (!file) throw new NotFoundException('File not found');
      return [file];
    }

    return this.prisma.file.findMany({
      where: { spaceId, folderId: resolvedFolderId },
      include: { uploadedBy: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async downloadFile(token: string, fileId: string, email?: string) {
    const share = await this.resolveToken(token, email);

    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');

    // Scope check
    if (share.resourceType === 'FILE') {
      if (share.fileId !== fileId) throw new ForbiddenException('File not in share scope');
    } else if (share.resourceType === 'FOLDER') {
      await this.assertUnderFolder(file.folderId ?? 'root', share.folderId, file.spaceId);
    } else if (share.resourceType === 'SPACE') {
      if (file.spaceId !== share.spaceId) throw new ForbiddenException('File not in share scope');
    }

    const response = await fetch(file.url, {
      headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!response.ok) throw new NotFoundException('File not available in storage');

    return { stream: Readable.fromWeb(response.body as any), file };
  }

  async listForSpace(spaceId: string, userId: string) {
    await this.assertOwnerAccess(spaceId, userId);
    return this.prisma.share.findMany({
      where: {
        revokedAt: null,
        OR: [{ spaceId }, { folder: { spaceId } }, { file: { spaceId } }],
      },
      include: { createdBy: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(shareId: string, userId: string) {
    const share = await this.prisma.share.findUnique({ where: { id: shareId } });
    if (!share) throw new NotFoundException('Share not found');

    const spaceId = share.spaceId ?? (await this.resolveSpaceFromShare(share));
    await this.assertOwnerAccess(spaceId, userId);

    return this.prisma.share.update({
      where: { id: shareId },
      data: { revokedAt: new Date() },
    });
  }

  // --- helpers ---

  private async resolveOwningSpaceId(dto: CreateShareDto): Promise<string> {
    if (dto.spaceId) return dto.spaceId;
    if (dto.folderId) {
      const f = await this.prisma.folder.findUnique({ where: { id: dto.folderId } });
      if (!f) throw new NotFoundException('Folder not found');
      return f.spaceId;
    }
    if (dto.fileId) {
      const f = await this.prisma.file.findUnique({ where: { id: dto.fileId } });
      if (!f) throw new NotFoundException('File not found');
      return f.spaceId;
    }
    throw new BadRequestException('No resource specified');
  }

  private async resolveSpaceFromShare(share: any): Promise<string> {
    if (share.spaceId) return share.spaceId;
    if (share.folderId) {
      const f = await this.prisma.folder.findUnique({ where: { id: share.folderId } });
      return f?.spaceId;
    }
    if (share.fileId) {
      const f = await this.prisma.file.findUnique({ where: { id: share.fileId } });
      return f?.spaceId;
    }
  }

  private async assertOwnerAccess(spaceId: string, userId: string) {
    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) throw new NotFoundException('Space not found');
    if (space.ownerId !== userId) throw new ForbiddenException('Only the owner can manage shares');
  }

  /** Walk folderId's ancestor chain to confirm it's within rootFolderId */
  private async assertUnderFolder(folderId: string, rootFolderId: string, spaceId: string) {
    if (folderId === rootFolderId) return;
    let cur = await this.prisma.folder.findFirst({ where: { id: folderId, spaceId } });
    while (cur) {
      if (cur.id === rootFolderId) return;
      if (!cur.parentId) break;
      cur = await this.prisma.folder.findFirst({ where: { id: cur.parentId } });
    }
    throw new ForbiddenException('Folder is not within share scope');
  }
}
