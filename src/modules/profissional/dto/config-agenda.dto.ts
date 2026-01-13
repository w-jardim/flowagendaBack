import { IsArray, IsString, IsNumber, IsOptional, Matches } from 'class-validator';

export class ConfigAgendaDto {
  @IsOptional()
  @IsNumber()
  antecedencia_cancelamento_horas?: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, { message: 'Formato de hora deve ser HH:mm:ss' })
  horario_inicio: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, { message: 'Formato de hora deve ser HH:mm:ss' })
  horario_fim: string;

  @IsArray()
  @IsString({ each: true })
  dias_ativos: string[]; // ex: ['seg','ter','qua','qui','sex']
}