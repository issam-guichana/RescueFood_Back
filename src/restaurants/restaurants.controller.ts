import { Body, Controller, Get, Post, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { StockItem } from './schemas/restaurant.schema';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateStockItemDto } from './dto/create-item.dto';
import { UpdateStockQuantityDto } from './dto/update-item.dto';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('restaurants')
@UseGuards(AuthenticationGuard, RolesGuard)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  // ----------- CRUD DE BASE -----------
  /**
   * Create a restaurant - Restaurant role only
   * POST /restaurants
   */
  @Post()
  @Roles(UserRole.RESTAURANT)
  create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantsService.create(createRestaurantDto);
  }

  /**
   * Get all restaurants - All authenticated users can view
   * GET /restaurants
   */
  @Get()
  @Roles(UserRole.RESTAURANT, UserRole.CLIENT, UserRole.CHARITY)
  findAll() {
    return this.restaurantsService.findAll();
  }

  /**
   * Get a specific restaurant - All authenticated users
   * GET /restaurants/:id
   */
  @Get(':id')
  @Roles(UserRole.RESTAURANT, UserRole.CLIENT, UserRole.CHARITY)
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  /**
   * Update restaurant - Restaurant role only
   * PATCH /restaurants/:id
   */
  @Patch(':id')
  @Roles(UserRole.RESTAURANT)
  update(@Param('id') id: string, @Body() updateRestaurantDto: UpdateRestaurantDto) {
    return this.restaurantsService.update(id, updateRestaurantDto);
  }

  /**
   * Delete restaurant - Restaurant role only
   * DELETE /restaurants/:id
   */
  @Delete(':id')
  @Roles(UserRole.RESTAURANT)
  remove(@Param('id') id: string) {
    return this.restaurantsService.remove(id);
  }

  // ----------- GESTION DU STOCK (Legacy - kept for backward compatibility) -----------
  /**
   * Add stock item - Restaurant role only
   * POST /restaurants/:id/stock
   */
  @Post(':id/stock')
  @Roles(UserRole.RESTAURANT)
  addStockItem(@Param('id') id: string, @Body() item: CreateStockItemDto) {
    return this.restaurantsService.addStockItem(id, item as StockItem);
  }

  /**
   * Update stock quantity - Restaurant role only
   * PATCH /restaurants/:id/stock/:name
   */
  @Patch(':id/stock/:name')
  @Roles(UserRole.RESTAURANT)
  updateStockQuantity(
    @Param('id') id: string,
    @Param('name') name: string,
    @Body() updateStockDto: UpdateStockQuantityDto,
  ) {
    return this.restaurantsService.updateStockQuantity(id, name, updateStockDto.quantity);
  }

  /**
   * Get restaurant stock - All authenticated users
   * GET /restaurants/:id/stock
   */
  @Get(':id/stock')
  @Roles(UserRole.RESTAURANT, UserRole.CLIENT, UserRole.CHARITY)
  getStock(@Param('id') id: string) {
    return this.restaurantsService.getStock(id);
  }

  /**
   * Get restaurant dashboard - Restaurant role only
   * GET /restaurants/:id/dashboard
   */
  @Get(':id/dashboard')
  @Roles(UserRole.RESTAURANT)
  getDashboard(@Param('id') id: string) {
    return this.restaurantsService.getDashboard(id);
  }
}
