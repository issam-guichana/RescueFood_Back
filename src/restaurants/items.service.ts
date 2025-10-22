import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item } from './schemas/item.schema';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectModel(Item.name)
    private itemModel: Model<Item>,
  ) {}

  /**
   * Create a new item (Restaurant only)
   */
  async create(createItemDto: CreateItemDto, ownerId: string): Promise<Item> {
    const itemData = {
      ...createItemDto,
      ownerId: new Types.ObjectId(ownerId),
      restaurantId: new Types.ObjectId(createItemDto.restaurantId),
      isFree: createItemDto.isFree ?? false,
      isAvailable: createItemDto.isAvailable ?? true,
    };

    const item = new this.itemModel(itemData);
    return item.save();
  }

  /**
   * Get all available items (visible to all authenticated users)
   */
  async findAll(): Promise<Item[]> {
    return this.itemModel
      .find({ isAvailable: true, quantity: { $gt: 0 } })
      .populate('restaurantId', 'name address phone')
      .exec();
  }

  /**
   * Get items for sale (Customer can see these)
   */
  async findForSale(): Promise<Item[]> {
    return this.itemModel
      .find({ isAvailable: true, isFree: false, quantity: { $gt: 0 } })
      .populate('restaurantId', 'name address phone')
      .exec();
  }

  /**
   * Get free items (Charity can see these)
   */
  async findFreeItems(): Promise<Item[]> {
    return this.itemModel
      .find({ isAvailable: true, isFree: true, quantity: { $gt: 0 } })
      .populate('restaurantId', 'name address phone')
      .exec();
  }

  /**
   * Get items by restaurant (for restaurant owner to manage)
   */
  async findByRestaurant(restaurantId: string): Promise<Item[]> {
    return this.itemModel.find({ restaurantId: new Types.ObjectId(restaurantId) }).exec();
  }

  /**
   * Get items owned by specific user (restaurant)
   */
  async findByOwner(ownerId: string): Promise<Item[]> {
    return this.itemModel.find({ ownerId: new Types.ObjectId(ownerId) }).exec();
  }

  /**
   * Get a single item by ID
   */
  async findOne(id: string): Promise<Item> {
    const item = await this.itemModel
      .findById(id)
      .populate('restaurantId', 'name address phone')
      .exec();

    if (!item) {
      throw new NotFoundException('Item not found');
    }
    return item;
  }

  /**
   * Update an item (Restaurant owner only)
   */
  async update(
    id: string,
    updateItemDto: UpdateItemDto,
    userId: string,
  ): Promise<Item> {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Check if user owns this item
    if (item.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own items');
    }

    Object.assign(item, updateItemDto);
    item.lastUpdated = new Date();
    return item.save();
  }

  /**
   * Delete an item (Restaurant owner only)
   */
  async remove(id: string, userId: string): Promise<{ message: string }> {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Check if user owns this item
    if (item.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own items');
    }

    await this.itemModel.findByIdAndDelete(id);
    return { message: 'Item deleted successfully' };
  }

  /**
   * Update item quantity (used when items are purchased/donated)
   */
  async updateQuantity(
    id: string,
    quantityChange: number,
    type: 'sold' | 'donated',
  ): Promise<Item> {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.quantity < Math.abs(quantityChange)) {
      throw new BadRequestException('Insufficient quantity');
    }

    item.quantity -= Math.abs(quantityChange);

    if (type === 'sold') {
      item.sold += Math.abs(quantityChange);
    } else {
      item.donated += Math.abs(quantityChange);
    }

    item.lastUpdated = new Date();
    return item.save();
  }

  /**
   * Toggle item availability
   */
  async toggleAvailability(id: string, userId: string): Promise<Item> {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only modify your own items');
    }

    item.isAvailable = !item.isAvailable;
    item.lastUpdated = new Date();
    return item.save();
  }
}
