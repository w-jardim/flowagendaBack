import { Controller, Get, Patch, Param, Body, UseGuards, ParseUUIDPipe, Query, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AdminMetricsQueryDto } from './dto/admin-metrics-query.dto';
import { ParseIntPipe } from '@nestjs/common';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);
  constructor(private readonly adminService: AdminService) {}

  @Get('profissionais')
  async listarTodos(
    @Query() query?: AdminListQueryDto,
  ) {
    try {
      const p = query?.page ?? 1;
      const l = query?.limit ?? 20;
      const filters: any = {};
      if (query?.name) filters.name = query.name;
      if (query?.status) filters.status = query.status;
      this.logger.log(`Listagem de profissionais - page=${p} limit=${l} filters=${JSON.stringify(filters)}`);
      return this.adminService.findAllWithFilters(filters, p, l);
    } catch (err) {
      this.logger.error('Erro em listarTodos admin', err as any);
      throw err;
    }
  }

  @Get('profissionais/:id')
  async buscarPorId(@Param('id', new ParseUUIDPipe()) id: string) {
    try {
      const prof = await this.adminService.findById(id);
      if (!prof) return { message: 'Profissional não encontrado' };
      return prof;
    } catch (err) {
      this.logger.error(`Erro buscarPorId ${id}`, err as any);
      throw err;
    }
  }

  @Patch('profissionais/:id/status')
  async atualizarStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    try {
      const result = await this.adminService.updateStatus(id, dto.status);
      if (!result) return { message: 'Profissional não encontrado' };
      this.logger.log(`Status atualizado para ${dto.status} - ${id}`);
      return { message: 'Status atualizado', ...result };
    } catch (err) {
      this.logger.error(`Erro atualizarStatus ${id}`, err as any);
      throw err;
    }
  }

  @Patch('profissionais/:id/subscription')
  async updateSubscription(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: any,
  ) {
    try {
      const result = await this.adminService.updateSubscription(id, dto.days, dto.expiresAt);
      if (!result) return { message: 'Profissional não encontrado' };
      this.logger.log(`Subscription atualizada - ${id} -> ${result.data_expiracao_assinatura}`);
      return { message: 'Subscription updated', ...result };
    } catch (err) {
      this.logger.error(`Erro updateSubscription ${id}`, err as any);
      throw err;
    }
  }

  @Get('stats')
  async stats() {
    try {
      return this.adminService.getStats();
    } catch (err) {
      this.logger.error('Erro ao buscar stats admin', err as any);
      throw err;
    }
  }

  @Get('metrics/growth')
  async metricsGrowth(@Query() query?: AdminMetricsQueryDto) {
    try {
      return this.adminService.getMetricsGrowth(query?.granularity ?? 'month', query?.since);
    } catch (err) {
      this.logger.error('Erro metrics/growth', err as any);
      throw err;
    }
  }

  @Get('metrics/engagement')
  async metricsEngagement() {
    try {
      return this.adminService.getMetricsEngagement();
    } catch (err) {
      this.logger.error('Erro metrics/engagement', err as any);
      throw err;
    }
  }

  @Get('metrics/financial')
  async metricsFinancial() {
    try {
      return this.adminService.getMetricsFinancial();
    } catch (err) {
      this.logger.error('Erro metrics/financial', err as any);
      throw err;
    }
  }

  @Get('metrics/technical')
  async metricsTechnical() {
    try {
      return this.adminService.getMetricsTechnical();
    } catch (err) {
      this.logger.error('Erro metrics/technical', err as any);
      throw err;
    }
  }

  @Get('metrics/top')
  async metricsTop(@Query('since', ParseIntPipe) since?: number) {
    try {
      return this.adminService.getTopProfissionais(since);
    } catch (err) {
      this.logger.error('Erro metrics/top', err as any);
      throw err;
    }
  }
}
