import { IsNumber } from 'class-validator';

export class UpdateStockQuantityDto {
  @IsNumber()
  quantity: number;
}
