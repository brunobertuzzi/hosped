import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  guestName!: string;

  @IsString()
  @IsNotEmpty()
  guestDocument!: string;

  @IsEmail()
  guestEmail!: string;

  @IsString()
  @IsNotEmpty()
  guestTelefone!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsDateString()
  dataCheckIn!: string;

  @IsDateString()
  dataCheckOut!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorTotal?: number;

  @IsString()
  @IsNotEmpty()
  origem!: string;
}
