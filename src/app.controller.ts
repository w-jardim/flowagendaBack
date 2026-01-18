import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profissional } from './modules/profissional/profissional.entity';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(Profissional)
    private readonly profRepo: Repository<Profissional>,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('internal/profissionais/count')
  async countProfissionais() {
    const cnt = await this.profRepo.count();
    return { count: cnt };
  }
}
