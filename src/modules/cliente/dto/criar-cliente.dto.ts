import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CriarClienteDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  nome: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 20)
  whatsapp: string;
}