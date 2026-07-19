import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @IsString()
  @IsNotEmpty()
  companyDoc!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  userName!: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password!: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsNumber()
  @IsOptional()
  mrr?: number;

  @IsOptional()
  paymentData?: any;

  @IsBoolean()
  @IsOptional()
  isTrial?: boolean;

  @IsNumber()
  @IsOptional()
  trialDays?: number;

  @IsString()
  @IsOptional()
  couponCode?: string;
}
