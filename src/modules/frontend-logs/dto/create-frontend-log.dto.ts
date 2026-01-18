import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateFrontendLogDto {
  @IsOptional()
  @IsString()
  level?: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  stack?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
