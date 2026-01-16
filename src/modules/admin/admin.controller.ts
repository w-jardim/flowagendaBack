import { Controller, Get, Patch, Param, Body, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('profissionais')
  async listarTodos(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 20;
    return this.adminService.findAll(p, l);
  }

  @Get('profissionais/:id')
  async buscarPorId(@Param('id', new ParseUUIDPipe()) id: string) {
    const prof = await this.adminService.findById(id);
    if (!prof) return { message: 'Profissional não encontrado' };
    return prof;
  }

  @Patch('profissionais/:id/status')
  async atualizarStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    const result = await this.adminService.updateStatus(id, dto.status);
    if (!result) return { message: 'Profissional não encontrado' };
    return { message: 'Status atualizado', ...result };
  }

  @Get('stats')
  async stats() {
    return this.adminService.getStats();
  }
}
