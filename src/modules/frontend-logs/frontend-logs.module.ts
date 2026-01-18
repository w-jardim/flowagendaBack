import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FrontendLog } from './frontend-log.entity';
import { FrontendLogsService } from './frontend-logs.service';
import { FrontendLogsController } from './frontend-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FrontendLog])],
  providers: [FrontendLogsService],
  controllers: [FrontendLogsController],
  exports: [FrontendLogsService],
})
export class FrontendLogsModule {}
