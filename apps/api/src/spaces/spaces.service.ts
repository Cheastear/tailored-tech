import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { del } from '@vercel/blob';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SpacesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, name: string) {
    return this.prisma.space.create({
      data: { name, ownerId: userId },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.space.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        _count: { select: { files: true, folders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    await this.assertReadAccess(id, userId);

    const [space, sizeAgg] = await Promise.all([
      this.prisma.space.findUnique({
        where: { id },
        include: {
          owner: { select: { id: true, email: true, name: true, avatar: true } },
          members: {
            include: {
              user: { select: { id: true, email: true, name: true, avatar: true } },
            },
          },
          _count: { select: { files: true, folders: true } },
        },
      }),
      this.prisma.file.aggregate({
        where: { spaceId: id },
        _sum: { size: true },
      }),
    ]);

    return { ...space, totalSize: sizeAgg._sum.size ?? 0 };
  }

  async rename(id: string, userId: string, name: string) {
    await this.assertOwnerAccess(id, userId);

    return this.prisma.space.update({ where: { id }, data: { name } });
  }

  async remove(id: string, userId: string) {
    await this.assertOwnerAccess(id, userId);

    const files = await this.prisma.file.findMany({ where: { spaceId: id } });

    if (files.length > 0) {
      await del(files.map((f) => f.url));
    }

    await this.prisma.space.delete({ where: { id } });
  }

  async addMember(spaceId: string, requesterId: string, email: string, role: 'READER' | 'WRITER') {
    await this.assertOwnerAccess(spaceId, requesterId);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    if (space.ownerId === user.id) {
      throw new ForbiddenException('Cannot add the owner as a member');
    }

    return this.prisma.spaceMember.upsert({
      where: { spaceId_userId: { spaceId, userId: user.id } },
      create: { spaceId, userId: user.id, role },
      update: { role },
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true } },
      },
    });
  }

  async removeMember(spaceId: string, requesterId: string, userId: string) {
    await this.assertOwnerAccess(spaceId, requesterId);

    await this.prisma.spaceMember.deleteMany({ where: { spaceId, userId } });
  }

  async getRole(spaceId: string, userId: string): Promise<string | null> {
    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) throw new NotFoundException('Space not found');

    if (space.ownerId === userId) return 'OWNER';

    const member = await this.prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId, userId } },
    });

    return member?.role ?? null;
  }

  async assertReadAccess(spaceId: string, userId: string) {
    const role = await this.getRole(spaceId, userId);
    if (!role) throw new ForbiddenException();
  }

  async assertWriteAccess(spaceId: string, userId: string) {
    const role = await this.getRole(spaceId, userId);
    if (!role || role === 'READER') throw new ForbiddenException();
  }

  async assertOwnerAccess(spaceId: string, userId: string) {
    const role = await this.getRole(spaceId, userId);
    if (role !== 'OWNER') throw new ForbiddenException();
  }
}
