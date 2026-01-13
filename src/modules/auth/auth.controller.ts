import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Rota para novos profissionais se cadastrarem
   */
  @Post('registro')
  async registrar(@Body() dto: RegistroDto) {
    return this.authService.registrar(dto);
  }

  /**
   * Rota para login
   */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Rota protegida que retorna os dados do profissional logado
   * O Guard verifica o token antes de deixar a requisição chegar aqui
   */
  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  async obterPerfil(@Request() req) {
    // O req.user é preenchido automaticamente pela nossa JwtStrategy
    return this.authService.obterPerfil(req.user.id);
  }
}