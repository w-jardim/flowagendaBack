import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class ServicoDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Transform(({ obj }) => (obj?.duracao !== undefined ? Number(obj.duracao) : obj?.duracao_minutos))
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