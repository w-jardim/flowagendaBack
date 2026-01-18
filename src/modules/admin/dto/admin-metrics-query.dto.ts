import { IsOptional, IsIn, IsISO8601 } from 'class-validator';

export class AdminMetricsQueryDto {
  @IsOptional()
  @IsIn(['day', 'month'])
  granularity?: 'day' | 'month' = 'month';

  @IsOptional()
  @IsISO8601()
  since?: string;
}
