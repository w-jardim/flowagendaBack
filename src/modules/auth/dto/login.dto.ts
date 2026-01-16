import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  senha?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  password?: string;
}