import { IsNumber, IsOptional, IsBoolean, IsString, IsDate, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemCategory } from '../schemas/item.schema';

export class UpdateItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ItemCategory)
  @IsOptional()
  category?: ItemCategory;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountedPrice?: number;

  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

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

  @IsNumber()
  @Min(1)
  @IsOptional()
  lowStockThreshold?: number;
}

// Kept for backward compatibility
export class UpdateStockQuantityDto {
  @IsNumber()
  quantity: number;
}
