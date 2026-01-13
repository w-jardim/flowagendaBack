import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO para login de profissional
 */
export class LoginDto {
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString()
  senha: string;
}