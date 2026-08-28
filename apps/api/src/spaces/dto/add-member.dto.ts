import { IsEmail, IsIn } from 'class-validator';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsIn(['READER', 'WRITER'])
  role: 'READER' | 'WRITER';
}
