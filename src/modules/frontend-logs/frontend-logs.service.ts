import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FrontendLog } from './frontend-log.entity';
import { CreateFrontendLogDto } from './dto/create-frontend-log.dto';

let Sentry: any = null;
try {
  // optional integration
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sentry = require('@sentry/node');
} catch (e) {}

@Injectable()
export class FrontendLogsService {
  private readonly logger = new Logger(FrontendLogsService.name);

  constructor(
    @InjectRepository(FrontendLog)
    private readonly repo: Repository<FrontendLog>,
  ) {
    if (process.env.SENTRY_DSN && Sentry) {
      Sentry.init({ dsn: process.env.SENTRY_DSN });
      this.logger.log('Sentry initialized for frontend logs');
    }
  }

  async create(dto: CreateFrontendLogDto) {
    const entity = this.repo.create({
      level: dto.level ?? 'error',
      message: dto.message,
      stack: dto.stack,
      url: dto.url,
      userAgent: dto.userAgent,
      metadata: dto.metadata,
    });

    const saved = await this.repo.save(entity);

    // forward to Sentry if configured
    try {
      if (process.env.SENTRY_DSN && Sentry) {
        if (dto.stack) {
          Sentry.captureException(new Error(dto.message), {
            extra: { stack: dto.stack, url: dto.url, metadata: dto.metadata },
          });
        } else {
          Sentry.captureMessage(dto.message, { level: dto.level ?? 'error' });
        }
      }
    } catch (err) {
      this.logger.warn('Failed to forward frontend log to Sentry: ' + err.message);
    }

    return saved;
  }

  async findRecent(limit = 50) {
    return this.repo.find({ order: { created_at: 'DESC' }, take: limit });
  }
}
