import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: {
    email: string;
    name?: string;
    password?: string;
    googleId?: string;
    avatar?: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  linkGoogle(id: string, googleId: string, avatar?: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { googleId, ...(avatar && { avatar }) },
    });
  }
}
