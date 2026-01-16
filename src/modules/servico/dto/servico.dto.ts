import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class ServicoDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  duracao_minutos: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  intervalo_minutos?: number;

  @IsOptional()
  @IsNumber()
  preco?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsNotEmpty()
  @IsUUID()
  profissional_id: string;  // Adicionado para receber o ID do profissional
}