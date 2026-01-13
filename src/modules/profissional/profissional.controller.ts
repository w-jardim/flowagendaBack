import { Controller, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfissionalService } from './profissional.service';
import { ConfigAgendaDto } from './dto/config-agenda.dto';

@UseGuards(JwtAuthGuard)
@Controller('profissionais')
export class ProfissionalController {
  constructor(private readonly profissionalService: ProfissionalService) {}

  // Outros endpoints...

  @Patch('configuracao')
  async configurarAgenda(@Request() req, @Body() dto: ConfigAgendaDto) {
    return this.profissionalService.salvarConfiguracao(req.user.id, dto);
  }
}