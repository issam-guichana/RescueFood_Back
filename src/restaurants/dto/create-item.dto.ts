import { IsString, IsNumber, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockItemDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  originalPrice: number;

  @IsNumber()
  @IsOptional()
  discountedPrice?: number;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  pickupStartTime?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  pickupEndTime?: Date;

  @IsString()
  @IsOptional()
  photo?: string;
}
