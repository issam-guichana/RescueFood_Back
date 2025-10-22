import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('orders')
@UseGuards(AuthenticationGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Create an order - Customer and Charity
   * POST /orders
   */
  @Post()
  @Roles(UserRole.CLIENT, UserRole.CHARITY)
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    return this.ordersService.create(createOrderDto, req.userId);
  }

  /**
   * Get my orders - Customer and Charity see their orders
   * GET /orders/my-orders
   */
  @Get('my-orders')
  @Roles(UserRole.CLIENT, UserRole.CHARITY)
  findMyOrders(@Request() req) {
    return this.ordersService.findByUser(req.userId);
  }

  /**
   * Get orders for my items - Restaurant sees orders for their items
   * GET /orders/my-restaurant-orders
   */
  @Get('my-restaurant-orders')
  @Roles(UserRole.RESTAURANT)
  findMyRestaurantOrders(@Request() req) {
    return this.ordersService.findByOwner(req.userId);
  }

  /**
   * Get orders by restaurant ID - Restaurant only
   * GET /orders/restaurant/:restaurantId
   */
  @Get('restaurant/:restaurantId')
  @Roles(UserRole.RESTAURANT)
  findByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.ordersService.findByRestaurant(restaurantId);
  }

  /**
   * Get a specific order
   * GET /orders/:id
   */
  @Get(':id')
  @Roles(UserRole.RESTAURANT, UserRole.CLIENT, UserRole.CHARITY)
  findOne(@Param('id') id: string, @Request() req) {
    return this.ordersService.findOne(id, req.userId, req.user.role);
  }

  /**
   * Update order status - Restaurant only
   * PATCH /orders/:id/status
   */
  @Patch(':id/status')
  @Roles(UserRole.RESTAURANT)
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req,
  ) {
    return this.ordersService.updateStatus(
      id,
      updateOrderDto.status,
      req.userId,
    );
  }

  /**
   * Cancel an order - Customer and Charity
   * PATCH /orders/:id/cancel
   */
  @Patch(':id/cancel')
  @Roles(UserRole.CLIENT, UserRole.CHARITY)
  cancel(@Param('id') id: string, @Request() req) {
    return this.ordersService.cancel(id, req.userId);
  }
}
