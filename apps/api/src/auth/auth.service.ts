import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
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
    const existing = await this.usersService.findByGoogleId(profile.googleId);
    if (existing) return existing;

    // Link Google to an existing email/password account
    const byEmail = await this.usersService.findByEmail(profile.email);
    if (byEmail) return this.usersService.linkGoogle(byEmail.id, profile.googleId, profile.avatar);

    return this.usersService.create({
      email: profile.email,
      name: profile.name,
      googleId: profile.googleId,
      avatar: profile.avatar,
    });
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
    return {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }
}
