import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SpacesModule } from '../spaces/spaces.module';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';

@Module({
  imports: [PrismaModule, SpacesModule],
  controllers: [FoldersController],
  providers: [FoldersService],
})
export class FoldersModule {}
