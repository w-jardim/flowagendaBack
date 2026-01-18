import { Controller, Post, Body, Get, UseGuards, Query, Logger } from '@nestjs/common';
import { FrontendLogsService } from './frontend-logs.service';
import { CreateFrontendLogDto } from './dto/create-frontend-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('logs/frontend')
export class FrontendLogsController {
  private readonly logger = new Logger(FrontendLogsController.name);

  constructor(private readonly svc: FrontendLogsService) {}

  @Post()
  async receive(@Body() dto: CreateFrontendLogDto) {
    // Accept anonymous calls from frontend (no auth required)
    const saved = await this.svc.create(dto);
    return { ok: true, id: saved.id };
  }

  // Optional: admin-only endpoint to list recent logs
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async recent(@Query('limit') limit = '50') {
    const l = Number(limit) || 50;
    return this.svc.findRecent(l);
  }
}
