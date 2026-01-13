import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ServicoService } from './servico.service';
import { ServicoDto } from './dto/servico.dto';

@UseGuards(JwtAuthGuard)
@Controller('servicos')
export class ServicoController {
  constructor(private readonly servicoService: ServicoService) {}

  @Post()
  async criar(@Request() req, @Body() dto: ServicoDto) {
    const profissionalId = req.user.id;
    return this.servicoService.criar(profissionalId, dto);
  }

  @Get()
  async listar(@Request() req) {
    const profissionalId = req.user.id;
    return this.servicoService.listarPorProfissional(profissionalId);
  }

  @Patch(':id')
  async atualizar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req,
    @Body() dto: Partial<ServicoDto>,
  ) {
    const profissionalId = req.user.id;
    return this.servicoService.atualizar(id, profissionalId, dto);
  }

  @Delete(':id')
  async remover(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    const profissionalId = req.user.id;
    await this.servicoService.remover(id, profissionalId);
    return { message: 'Serviço desativado com sucesso' };
  }
}