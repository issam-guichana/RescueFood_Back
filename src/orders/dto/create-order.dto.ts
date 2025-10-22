import { IsString, IsNumber, IsOptional, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsString()
  itemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  pickupTime?: Date;

  @IsString()
  @IsOptional()
  notes?: string;
}
