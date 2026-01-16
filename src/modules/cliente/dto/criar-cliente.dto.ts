import { IsNotEmpty, IsNumberString, Length, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CriarClienteDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  nome: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(8, 20)
  @Transform(({ obj, value }) => {
    const raw = value ?? obj.telefone;
    if (raw === undefined || raw === null) return raw;
    const digits = String(raw).replace(/\D/g, '');
    // Normaliza: se vier com 10/11 dígitos, mantemos; se vier com 13 (55 + DDD + número) já está ok
    return digits;
  })
  whatsapp: string;

  // Alias opcional vindo do front; mantido para não ser removido pelo whitelist
  @IsOptional()
  @IsNumberString()
  @Length(8, 20)
  telefone?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(11, 14)
  cpf?: string;

  @IsOptional()
  @IsString()
  endereco?: string;
}