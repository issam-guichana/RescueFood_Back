import { Body, Controller, Get, Post, Param, Patch, Delete } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { StockItem } from './schemas/restaurant.schema';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateStockItemDto } from './dto/create-item.dto';
import { UpdateStockQuantityDto } from './dto/update-item.dto';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  // ----------- CRUD DE BASE -----------
  @Post()
  create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantsService.create(createRestaurantDto);
  }

  @Get()
  findAll() {
    return this.restaurantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRestaurantDto: UpdateRestaurantDto) {
    return this.restaurantsService.update(id, updateRestaurantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.restaurantsService.remove(id);
  }

  // ----------- GESTION DU STOCK -----------
  @Post(':id/stock')
  addStockItem(@Param('id') id: string, @Body() item: CreateStockItemDto) {
    return this.restaurantsService.addStockItem(id, item as StockItem);
  }

  @Patch(':id/stock/:name')
  updateStockQuantity(
    @Param('id') id: string,
    @Param('name') name: string,
    @Body() updateStockDto: UpdateStockQuantityDto,
  ) {
    return this.restaurantsService.updateStockQuantity(id, name, updateStockDto.quantity);
  }

  @Get(':id/stock')
  getStock(@Param('id') id: string) {
    return this.restaurantsService.getStock(id);
  }
  @Get(':id/dashboard')
getDashboard(@Param('id') id: string) {
  return this.restaurantsService.getDashboard(id);
}

}
