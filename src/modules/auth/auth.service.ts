import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Profissional } from '../profissional/profissional.entity';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
    const startLogin = Date.now();
    this.logger.log(`[AUTH] ========== INICIANDO LOGIN ==========`);
    this.logger.log(`[AUTH] Email recebido: ${dto.email}`);

    // Normaliza o campo de senha: aceita tanto "senha" quanto "password"
    const senhaRecebida: string | undefined = dto.senha ?? dto.password;
    this.logger.log(`[AUTH] Senha recebida: ${senhaRecebida ? 'Sim' : 'NÃO'}`);

    // Busca explícita do campo de hash (porque na entity está select: false)
    const startDb = Date.now();
    this.logger.log(`[AUTH] Iniciando busca no banco de dados...`);
    
    const profissional = await this.profissionalRepo
      .createQueryBuilder('p')
      .addSelect('p.senhaHash')
      .where('p.email = :email', { email: dto.email })
      .getOne();

    const dbTime = Date.now() - startDb;
    this.logger.log(`[AUTH] Busca DB levou ${dbTime}ms`);
    this.logger.log(`[AUTH] Profissional encontrado: ${profissional ? 'SIM' : 'NÃO'}`);

    if (!profissional) {
      this.logger.warn(`[AUTH] ❌ Usuário não encontrado para email: ${dto.email}`);
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    // Bloqueio de login para contas com status BLOCKED
    if ((profissional as any).status === 'BLOCKED') {
      this.logger.warn(`[AUTH] ❌ Conta bloqueada para email: ${dto.email}`);
      throw new UnauthorizedException('Conta bloqueada');
    }

    if (!senhaRecebida) {
      this.logger.warn(`[AUTH] ❌ Senha não fornecida`);
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    try {
      this.logger.log(`[AUTH] Hash no banco: ${profissional.senhaHash?.substring(0, 20)}...`);
      
      const startCompare = Date.now();
      this.logger.log(`[AUTH] Iniciando bcrypt.compare...`);
      
      const senhaValida = await bcrypt.compare(senhaRecebida, profissional.senhaHash);
      
      const compareTime = Date.now() - startCompare;
      this.logger.log(`[AUTH] bcrypt.compare levou ${compareTime}ms - Resultado: ${senhaValida ? 'VÁLIDA' : 'INVÁLIDA'}`);

      if (!senhaValida) {
        this.logger.warn(`[AUTH] ❌ Senha inválida para email: ${dto.email}`);
        throw new UnauthorizedException('E-mail ou senha incorretos');
      }

      const startJwt = Date.now();
      this.logger.log(`[AUTH] Gerando JWT token...`);
      
      const result = this.gerarToken(profissional);
      
      const jwtTime = Date.now() - startJwt;
      const totalTime = Date.now() - startLogin;
      
      this.logger.log(`[AUTH] JWT gerado em ${jwtTime}ms`);
      this.logger.log(`[AUTH] ✅ LOGIN BEM-SUCEDIDO - Tempo total: ${totalTime}ms`);
      this.logger.log(`[AUTH] ========== FIM LOGIN ==========`);

      return result;
    } catch (err) {
      const totalTime = Date.now() - startLogin;
      this.logger.error(`[AUTH] ❌ ERRO NA VALIDAÇÃO (${totalTime}ms): ${err.message}`, err.stack);
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }
  }

  /**
   * Gera o token assinado
   */
  private gerarToken(profissional: Profissional): { access_token: string } {
    const payload = {
      sub: profissional.id,
      email: profissional.email,
      role: (profissional as any).role ?? 'PROFISSIONAL',
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