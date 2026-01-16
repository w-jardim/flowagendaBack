import { IsUUID, IsDateString, IsOptional, IsString, IsNumber, IsIn } from 'class-validator';

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

  // Campos opcionais que o frontend às vezes envia; aceitamos e ignoramos se presentes
  @IsOptional()
  @IsString()
  cliente_nome?: string;

  @IsOptional()
  @IsString()
  @IsIn(['confirmado', 'pendente', 'cancelado'])
  status?: string;
}