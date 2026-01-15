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
    const existe = await this.profissionalRepo.findOne({
      where: { email: dto.email },
    });

    if (existe) {
      throw new ConflictException('Este e-mail já está cadastrado no FlowAgenda');
    }

    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(dto.senha, saltRounds);

    const profissional = this.profissionalRepo.create({
      ...dto,
      senhaHash: senhaHash,
    });

    await this.profissionalRepo.save(profissional);

    return this.gerarToken(profissional);
  }

  /**
   * Valida credenciais e realiza login
   */
  async login(dto: LoginDto): Promise<{ access_token: string }> {
    // Usamos QueryBuilder para garantir que o campo senha_hash seja selecionado
    // mesmo que esteja com "select: false" na entidade.
    const profissional = await this.profissionalRepo
      .createQueryBuilder('profissional')
      .addSelect('profissional.senha_hash')
      .where('profissional.email = :email', { email: dto.email })
      .getOne();

    if (!profissional) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    try {
      // Verifica se a senha é válida
      const senhaValida = await bcrypt.compare(dto.senha, profissional.senhaHash);
      
      if (!senhaValida) {
        throw new UnauthorizedException('E-mail ou senha incorretos');
      }
    } catch (error) {
      // Se o bcrypt falhar por falta de argumentos, tratamos como erro de login
      throw new UnauthorizedException('Erro ao validar credenciais');
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
   * Busca perfil do profissional logado
   */
  async obterPerfil(profissionalId: string): Promise<Partial<Profissional>> {
    const profissional = await this.profissionalRepo.findOne({
      where: { id: profissionalId },
    });

    if (!profissional) {
      throw new UnauthorizedException('Profissional não encontrado');
    }

    const { senhaHash, ...resultado } = profissional;
    return resultado;
  }
}