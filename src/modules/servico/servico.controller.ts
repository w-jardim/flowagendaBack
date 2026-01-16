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
    // DEBUG logs - REMOVER APÓS TESTE
    console.log('DEBUG: ServicoController.criar chamado'); // REMOVER APÓS TESTE
    console.log('DEBUG: req.user:', req.user); // REMOVER APÓS TESTE

    const profissionalId = req.user?.id;
    console.log('DEBUG: profissionalId extraído:', profissionalId); // REMOVER APÓS TESTE

    return this.servicoService.criar(profissionalId, dto);
  }

  @Get()
  async listar(@Request() req) {
    // DEBUG logs - REMOVER APÓS TESTE
    console.log('DEBUG: ServicoController.listar chamado'); // REMOVER APÓS TESTE
    console.log('DEBUG: req.user:', req.user); // REMOVER APÓS TESTE

    const profissionalId = req.user?.id;
    console.log('DEBUG: profissionalId extraído (listar):', profissionalId); // REMOVER APÓS TESTE

    return this.servicoService.listarPorProfissional(profissionalId);
  }

  @Patch(':id')
  async atualizar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req,
    @Body() dto: Partial<ServicoDto>,
  ) {
    // DEBUG logs - REMOVER APÓS TESTE
    console.log('DEBUG: ServicoController.atualizar chamado para id:', id); // REMOVER APÓS TESTE
    console.log('DEBUG: req.user:', req.user); // REMOVER APÓS TESTE

    const profissionalId = req.user?.id;
    return this.servicoService.atualizar(id, profissionalId, dto);
  }

  @Delete(':id')
  async remover(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    // DEBUG logs - REMOVER APÓS TESTE
    console.log('DEBUG: ServicoController.remover chamado para id:', id); // REMOVER APÓS TESTE
    console.log('DEBUG: req.user:', req.user); // REMOVER APÓS TESTE

    const profissionalId = req.user?.id;
    await this.servicoService.remover(id, profissionalId);
    return { message: 'Serviço desativado com sucesso' };
  }
}