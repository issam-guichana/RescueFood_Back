import { IsString, IsNumber, IsOptional, IsDate, IsBoolean, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemCategory } from '../schemas/item.schema';

export class CreateItemDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ItemCategory)
  category: ItemCategory;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountedPrice?: number;

  @IsBoolean()
  @IsOptional()
  isFree?: boolean; // true = for charity, false = for sale

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

  @IsString()
  restaurantId: string; // The restaurant this item belongs to

  @IsNumber()
  @Min(1)
  @IsOptional()
  lowStockThreshold?: number;
}

// Kept for backward compatibility with stock management
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
