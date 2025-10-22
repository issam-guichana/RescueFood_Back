import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('items')
@UseGuards(AuthenticationGuard, RolesGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  /**
   * Create a new item - Restaurant only
   * POST /items
   */
  @Post()
  @Roles(UserRole.RESTAURANT)
  create(@Body() createItemDto: CreateItemDto, @Request() req) {
    return this.itemsService.create(createItemDto, req.userId);
  }

  /**
   * Get all available items - All authenticated users
   * GET /items
   */
  @Get()
  @Roles(UserRole.RESTAURANT, UserRole.CLIENT, UserRole.CHARITY)
  findAll() {
    return this.itemsService.findAll();
  }

  /**
   * Get items for sale - Customer and Charity can access
   * GET /items/for-sale
   */
  @Get('for-sale')
  @Roles(UserRole.CLIENT, UserRole.CHARITY)
  findForSale() {
    return this.itemsService.findForSale();
  }

  /**
   * Get free items - Charity only
   * GET /items/free
   */
  @Get('free')
  @Roles(UserRole.CHARITY)
  findFreeItems() {
    return this.itemsService.findFreeItems();
  }

  /**
   * Get items owned by logged-in restaurant
   * GET /items/my-items
   */
  @Get('my-items')
  @Roles(UserRole.RESTAURANT)
  findMyItems(@Request() req) {
    return this.itemsService.findByOwner(req.userId);
  }

  /**
   * Get items by restaurant ID
   * GET /items/restaurant/:restaurantId
   * IMPORTANT: This must come BEFORE /items/:id to avoid route conflicts
   */
  @Get('restaurant/:restaurantId')
  @Roles(UserRole.RESTAURANT, UserRole.CLIENT, UserRole.CHARITY)
  findByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.itemsService.findByRestaurant(restaurantId);
  }

  /**
   * Get a specific item by ID - All authenticated users
   * GET /items/:id
   * IMPORTANT: This should be LAST among GET routes to avoid conflicts
   */
  @Get(':id')
  @Roles(UserRole.RESTAURANT, UserRole.CLIENT, UserRole.CHARITY)
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  /**
   * Update an item - Restaurant owner only
   * PATCH /items/:id
   */
  @Patch(':id')
  @Roles(UserRole.RESTAURANT)
  update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @Request() req,
  ) {
    return this.itemsService.update(id, updateItemDto, req.userId);
  }

  /**
   * Toggle item availability - Restaurant owner only
   * PATCH /items/:id/toggle-availability
   */
  @Patch(':id/toggle-availability')
  @Roles(UserRole.RESTAURANT)
  toggleAvailability(@Param('id') id: string, @Request() req) {
    return this.itemsService.toggleAvailability(id, req.userId);
  }

  /**
   * Delete an item - Restaurant owner only
   * DELETE /items/:id
   */
  @Delete(':id')
  @Roles(UserRole.RESTAURANT)
  remove(@Param('id') id: string, @Request() req) {
    return this.itemsService.remove(id, req.userId);
  }
}
