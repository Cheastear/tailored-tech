import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SpacesModule } from '../spaces/spaces.module';
import { SyncModule } from '../sync/sync.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [PrismaModule, SpacesModule, SyncModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
