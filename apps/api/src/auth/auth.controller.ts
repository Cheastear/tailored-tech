import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { put } from '@vercel/blob';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.register(dto);
    res.cookie('auth_token', this.authService.signToken(user.id), this.authService.cookieOptions());
    return this.sanitize(user);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as User;
    res.cookie('auth_token', this.authService.signToken(user.id), this.authService.cookieOptions());
    return this.sanitize(user);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth() {}

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    res.cookie('auth_token', this.authService.signToken(user.id), this.authService.cookieOptions());
    res.redirect(`${this.configService.getOrThrow('FRONTEND_URL')}/dashboard`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    return this.sanitize(req.user as User);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @Req() req: Request,
    @Body() body: { name?: string; currentPassword?: string; newPassword?: string },
  ) {
    const user = req.user as User;
    const updates: { name?: string; password?: string } = {};

    if (body.name !== undefined) updates.name = body.name.trim() || null!;

    if (body.newPassword) {
      if (!body.currentPassword) throw new BadRequestException('Current password required');
      if (!user.password) throw new BadRequestException('No password set on this account');
      const valid = await bcrypt.compare(body.currentPassword, user.password);
      if (!valid) throw new BadRequestException('Current password is incorrect');
      updates.password = await bcrypt.hash(body.newPassword, 12);
    }

    const updated = await this.usersService.update(user.id, updates);
    return this.sanitize(updated);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadAvatar(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    const user = req.user as User;
    const blob = await put(`avatars/${user.id}`, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      addRandomSuffix: false,
    });
    const updated = await this.usersService.update(user.id, { avatar: blob.url });
    return this.sanitize(updated);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token');
    return { success: true };
  }

  private sanitize({ password: _password, ...user }: User) {
    return user;
  }
}
