import { Controller, Post, Body } from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { CriarClienteDto } from './dto/criar-cliente.dto';

@Controller('clientes')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @Post()
  async criar(@Body() dto: CriarClienteDto) {
    return this.clienteService.criar(dto);
  }
}