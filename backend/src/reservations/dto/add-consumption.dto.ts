import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddConsumptionDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsNumber()
  @Min(1)
  quantidade!: number;
}
