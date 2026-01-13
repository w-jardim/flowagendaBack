import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Profissional } from '../profissional/profissional.entity';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Profissional)
    private profissionalRepo: Repository<Profissional>,
    private jwtService: JwtService,
  ) {}

  /**
   * Registra um novo profissional
   */
  async registrar(dto: RegistroDto): Promise<{ access_token: string }> {
    // 1. Verifica se o e-mail já está em uso
    const existe = await this.profissionalRepo.findOne({
      where: { email: dto.email },
    });

    if (existe) {
      throw new ConflictException('Este e-mail já está cadastrado no FlowAgenda');
    }

    // 2. Transforma a senha em Hash (Segurança Máxima)
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(dto.senha, saltRounds);

    // 3. Salva o profissional
    const profissional = this.profissionalRepo.create({
      ...dto,
      senha_hash: senhaHash,
    });

    await this.profissionalRepo.save(profissional);

    // 4. Já retorna o token para o usuário logar automaticamente após o cadastro
    return this.gerarToken(profissional);
  }

  /**
   * Valida credenciais e realiza login
   */
  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const profissional = await this.profissionalRepo.findOne({
      where: { email: dto.email },
    });

    // Verifica se profissional existe e se a senha é válida
    if (!profissional || !(await bcrypt.compare(dto.senha, profissional.senha_hash))) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    return this.gerarToken(profissional);
  }

  /**
   * Gera o token assinado
   */
  private gerarToken(profissional: Profissional): { access_token: string } {
    const payload: JwtPayload = {
      sub: profissional.id,
      email: profissional.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Busca perfil do profissional logado (usado na rota /perfil)
   */
  async obterPerfil(profissionalId: string): Promise<Partial<Profissional>> {
    const profissional = await this.profissionalRepo.findOne({
      where: { id: profissionalId },
    });

    if (!profissional) {
      throw new UnauthorizedException('Profissional não encontrado');
    }

    // Removemos a senha_hash do retorno por segurança
    const { senha_hash, ...resultado } = profissional;
    return resultado;
  }
}