import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgendamentoService } from './agendamento.service';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto';

@UseGuards(JwtAuthGuard)
@Controller('agendamentos')
export class AgendamentoController {
  constructor(private readonly service: AgendamentoService) {}

  @Post()
  async criar(@Request() req, @Body() dto: CriarAgendamentoDto) {
    return this.service.criar(req.user.id, dto);
  }

  @Get()
  async listar(@Request() req) {
    return this.service.listarPorProfissional(req.user.id);
  }
}