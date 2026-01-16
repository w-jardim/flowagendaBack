import { Controller, Post, Get, Body, UseGuards, Request, Param, ParseUUIDPipe, Patch, Delete, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClienteService } from './cliente.service';
import { CriarClienteDto } from './dto/criar-cliente.dto';

@Controller('clientes')
export class ClienteController {
  private logger = new Logger('ClienteController');

  constructor(private readonly clienteService: ClienteService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async criar(@Body() dto: CriarClienteDto, @Request() req) {
    try {
      const profissionalId = req.user.id;
      this.logger.log(`[CLIENTE] POST /clientes - Profissional ID: ${profissionalId}`);
      this.logger.log(`[CLIENTE] DTO recebido: ${JSON.stringify(dto)}`);
      
      const result = await this.clienteService.criar(dto, profissionalId);
      
      this.logger.log(`[CLIENTE] ✅ Cliente criado com sucesso: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`[CLIENTE] ❌ Erro ao criar cliente: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async listarTodos(@Request() req) {
    const profissionalId = req.user.id;
    return this.clienteService.findAll(profissionalId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async buscarPorId(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    const profissionalId = req.user.id;
    return this.clienteService.findOne(id, profissionalId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async atualizar(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: Partial<CriarClienteDto>, @Request() req) {
    const profissionalId = req.user.id;
    return this.clienteService.atualizar(id, dto, profissionalId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletar(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    const profissionalId = req.user.id;
    await this.clienteService.deletar(id, profissionalId);
    return { message: 'Cliente deletado com sucesso' };
  }
}