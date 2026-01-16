import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'BLOCKED'])
  status: 'ACTIVE' | 'BLOCKED';
}
