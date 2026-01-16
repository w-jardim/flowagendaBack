import { Controller, Post, Get, Patch, Delete, Body, UseGuards, Request, Query, Param, ParseUUIDPipe, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgendamentoService } from './agendamento.service';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto';

@UseGuards(JwtAuthGuard)
@Controller('agendamentos')
export class AgendamentoController {
  private logger = new Logger('AgendamentoController');
  constructor(private readonly service: AgendamentoService) {}

  @Post()
  async criar(@Request() req, @Body() dto: CriarAgendamentoDto) {
    try {
      this.logger.log(`[AGENDA] POST /agendamentos - profissional=${req.user?.id}`);
      this.logger.log(`[AGENDA] payload: ${JSON.stringify(dto)}`);
      const result = await this.service.criar(req.user.id, dto);
      this.logger.log(`[AGENDA] ✅ Agendamento criado: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`[AGENDA] ❌ Erro ao criar agendamento: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  async listar(@Request() req, @Query('data') data?: string) {
    return this.service.listarPorProfissional(req.user.id, data);
  }

  @Patch(':id')
  async atualizar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req,
    @Body() dto: any,
  ) {
    return this.service.atualizar(id, req.user.id, dto);
  }

  @Delete(':id')
  async remover(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    await this.service.remover(id, req.user.id);
    return { message: 'Agendamento removido com sucesso' };
  }
}