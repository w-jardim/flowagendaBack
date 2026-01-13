import { IsNotEmpty, IsUUID, IsISO8601, IsOptional, IsString } from 'class-validator';

export class CriarAgendamentoDto {
  @IsNotEmpty()
  @IsUUID()
  servico_id: string;

  @IsNotEmpty()
  @IsUUID()
  cliente_id: string;

  @IsNotEmpty()
  @IsISO8601()
  data_inicio: string; // Ex: "2026-01-20T14:00:00Z"

  @IsOptional()
  @IsString()
  observacoes?: string;
}