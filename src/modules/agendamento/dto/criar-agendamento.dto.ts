import { IsUUID, IsDateString, IsOptional, IsString, IsNumber } from 'class-validator';

export class CriarAgendamentoDto {
  @IsUUID()
  cliente_id: string;

  @IsUUID()
  @IsOptional()
  servico_id?: string;

  @IsDateString()
  data_inicio: string;

  @IsNumber()
  @IsOptional()
  valor?: number;

  @IsString()
  @IsOptional()
  observacoes?: string;
}