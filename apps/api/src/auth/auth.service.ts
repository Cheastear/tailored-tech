import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { put } from '@vercel/blob';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateLocalUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  async validateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }) {
    const avatar = await this.mirrorAvatar(profile.googleId, profile.avatar);

    const existing = await this.usersService.findByGoogleId(profile.googleId);
    if (existing) {
      // Re-mirror if the stored URL is still a Google URL (migrates existing accounts)
      if (existing.avatar?.includes('googleusercontent.com')) {
        return this.usersService.update(existing.id, { avatar });
      }
      return existing;
    }

    // Link Google to an existing email/password account
    const byEmail = await this.usersService.findByEmail(profile.email);
    if (byEmail) return this.usersService.linkGoogle(byEmail.id, profile.googleId, avatar);

    return this.usersService.create({
      email: profile.email,
      name: profile.name,
      googleId: profile.googleId,
      avatar,
    });
  }

  private async mirrorAvatar(googleId: string, url?: string): Promise<string | undefined> {
    if (!url) return undefined;
    try {
      const res = await fetch(url);
      if (!res.ok) return url;
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get('content-type') ?? 'image/jpeg';
      const blob = await put(`avatars/${googleId}`, buffer, {
        access: 'public',
        contentType,
        addRandomSuffix: false,
      });
      return blob.url;
    } catch (err) {
      this.logger.warn(`Failed to mirror avatar for ${googleId}: ${err}`);
      return url;
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');
    const hashed = await bcrypt.hash(dto.password, 12);
    return this.usersService.create({ email: dto.email, name: dto.name, password: hashed });
  }

  signToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }

  cookieOptions() {
    const isProd = this.configService.get('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? ('none' as const) : ('lax' as const),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }
}
