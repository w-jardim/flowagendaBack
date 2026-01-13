import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profissional } from '../../profissional/profissional.entity';

/**
 * Payload do JWT após decodificação
 */
export interface JwtPayload {
  sub: string; // ID do profissional
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Profissional)
    private profissionalRepo: Repository<Profissional>,
  ) {
    // Pegamos a secret primeiro e garantimos que é string (fail-fast)
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // aqui passamos uma string garantida
    });
  }

  async validate(payload: JwtPayload): Promise<Profissional> {
    const profissional = await this.profissionalRepo.findOne({
      where: { id: payload.sub },
    });

    if (!profissional) {
      throw new UnauthorizedException('Profissional não encontrado ou acesso revogado');
    }

    return profissional;
  }
}