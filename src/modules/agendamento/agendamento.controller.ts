import { Controller, Post, UseGuards, Body, Request, Get, Query, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgendamentoService } from './agendamento.service';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto';

@UseGuards(JwtAuthGuard)
@Controller('agendamentos')
export class AgendamentoController {
  constructor(private readonly agendamentoService: AgendamentoService) {}

  @Post()
  async criar(@Body() dto: CriarAgendamentoDto) {
    return this.agendamentoService.criar(dto);
  }

  // Lista a agenda do profissional logado; opcional ?data=YYYY-MM-DD (UTC)
  @Get('minha-agenda')
  async minhaAgenda(@Request() req, @Query('data') date?: string) {
    const profissionalId = req.user.id;
    return this.agendamentoService.listarMinhaAgenda(profissionalId, date);
  }

  // Endpoint para enviar lembrete manual via WhatsApp
  @Post(':id/lembrete')
  async enviarLembrete(@Param('id') id: string) {
    await this.agendamentoService.enviarLembrete(id);
    return { message: 'Lembrete enviado com sucesso (simulado via log).' };
  }
}