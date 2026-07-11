import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CheckInDto {
  @IsString()
  @IsNotEmpty()
  documentoCheckIn!: string;

  @IsOptional()
  @IsString()
  roomId?: string;
}
