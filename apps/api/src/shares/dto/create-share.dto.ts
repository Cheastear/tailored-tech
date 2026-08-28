import { IsArray, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ShareMode, ShareResourceType } from '@prisma/client';

export class CreateShareDto {
  @IsEnum(ShareMode)
  mode: ShareMode;

  @IsEnum(ShareResourceType)
  resourceType: ShareResourceType;

  @IsOptional()
  @IsString()
  spaceId?: string;

  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsString()
  fileId?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  allowedEmails?: string[];
}
