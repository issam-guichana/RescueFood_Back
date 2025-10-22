import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderType, OrderStatus } from './schemas/order.schema';
import { Item } from '../restaurants/schemas/item.schema';
import { User, UserRole } from '../auth/schemas/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Item.name) private itemModel: Model<Item>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * Create an order (purchase or claim)
   */
  async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const item = await this.itemModel.findById(createOrderDto.itemId);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (!item.isAvailable) {
      throw new BadRequestException('Item is not available');
    }

    if (item.quantity < createOrderDto.quantity) {
      throw new BadRequestException('Insufficient quantity available');
    }

    // Determine order type and validate based on user role
    let orderType: OrderType;
    let totalPrice: number;

    if (user.role === UserRole.CLIENT) {
      // Customers can only buy items that are for sale
      if (item.isFree) {
        throw new ForbiddenException('Customers cannot claim free items');
      }
      orderType = OrderType.PURCHASE;
      totalPrice =
        (item.discountedPrice || item.price) * createOrderDto.quantity;
    } else if (user.role === UserRole.CHARITY) {
      // Charity can buy or claim free items
      if (item.isFree) {
        orderType = OrderType.CLAIM;
        totalPrice = 0;
      } else {
        orderType = OrderType.PURCHASE;
        totalPrice =
          (item.discountedPrice || item.price) * createOrderDto.quantity;
      }
    } else {
      throw new ForbiddenException('Only customers and charities can place orders');
    }

    // Create the order
    const order = new this.orderModel({
      userId: new Types.ObjectId(userId),
      itemId: new Types.ObjectId(createOrderDto.itemId),
      restaurantId: item.restaurantId,
      orderType,
      quantity: createOrderDto.quantity,
      totalPrice,
      status: OrderStatus.PENDING,
      pickupTime: createOrderDto.pickupTime,
      notes: createOrderDto.notes,
    });

    await order.save();

    // Update item quantity
    item.quantity -= createOrderDto.quantity;
    if (orderType === OrderType.PURCHASE) {
      item.sold += createOrderDto.quantity;
    } else {
      item.donated += createOrderDto.quantity;
    }
    item.lastUpdated = new Date();
    await item.save();

    return order;
  }

  /**
   * Get all orders for a user (customer or charity)
   */
  async findByUser(userId: string): Promise<Order[]> {
    return this.orderModel
      .find({ userId })
      .populate('itemId')
      .populate('restaurantId', 'name address phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get orders for a restaurant (to see who ordered from them)
   */
  async findByRestaurant(restaurantId: string): Promise<Order[]> {
    return this.orderModel
      .find({ restaurantId })
      .populate('userId', 'nom prenom email')
      .populate('itemId', 'name category')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get a single order
   */
  async findOne(id: string, userId: string, userRole: UserRole): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate('itemId')
      .populate('restaurantId', 'name address phone')
      .populate('userId', 'nom prenom email')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify access rights
    if (userRole === UserRole.RESTAURANT) {
      // Restaurant can see orders for their items
      const item = await this.itemModel.findById(order.itemId);
      if (item.ownerId.toString() !== userId) {
        throw new ForbiddenException('You can only view orders for your items');
      }
    } else {
      // Customer/Charity can only see their own orders
      if (order.userId.toString() !== userId) {
        throw new ForbiddenException('You can only view your own orders');
      }
    }

    return order;
  }

  /**
   * Update order status (typically by restaurant)
   */
  async updateStatus(
    id: string,
    status: OrderStatus,
    userId: string,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify that the user owns the item in this order
    const item = await this.itemModel.findById(order.itemId);
    if (item.ownerId.toString() !== userId) {
      throw new ForbiddenException(
        'You can only update orders for your own items',
      );
    }

    order.status = status;
    return order.save();
  }

  /**
   * Cancel an order (by customer/charity if still pending)
   */
  async cancel(id: string, userId: string): Promise<Order> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId.toString() !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    // Restore item quantity
    const item = await this.itemModel.findById(order.itemId);
    if (item) {
      item.quantity += order.quantity;
      if (order.orderType === OrderType.PURCHASE) {
        item.sold -= order.quantity;
      } else {
        item.donated -= order.quantity;
      }
      await item.save();
    }

    order.status = OrderStatus.CANCELLED;
    return order.save();
  }

  /**
   * Get orders by owner (restaurant owner sees orders for their items)
   */
  async findByOwner(ownerId: string): Promise<Order[]> {
    // Find all items owned by this user
    const items = await this.itemModel.find({ ownerId }).select('_id');
    const itemIds = items.map((item) => item._id);

    return this.orderModel
      .find({ itemId: { $in: itemIds } })
      .populate('userId', 'nom prenom email role')
      .populate('itemId', 'name category price')
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }
}
