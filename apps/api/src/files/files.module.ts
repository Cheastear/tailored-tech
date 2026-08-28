import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SpacesModule } from '../spaces/spaces.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [PrismaModule, SpacesModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
