import { IsOptional, IsNumber, IsISO8601 } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsNumber()
  // number of days to extend (positive) or reduce (negative)
  days?: number;

  @IsOptional()
  @IsISO8601()
  // explicit expiration date (ISO string)
  expiresAt?: string;
}
