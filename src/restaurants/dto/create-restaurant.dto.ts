import { IsString, IsEmail, IsArray, IsOptional } from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsArray()
  @IsOptional()
  categories?: string[];
}
