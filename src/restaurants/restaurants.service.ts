import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Restaurant, RestaurantDocument, StockItem } from './schemas/restaurant.schema';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
  ) {}

  async create(data: Partial<Restaurant>): Promise<Restaurant> {
    return this.restaurantModel.create(data);
  }

  async findAll(): Promise<Restaurant[]> {
    return this.restaurantModel.find().exec();
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantModel.findById(id).exec();
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }

  async update(id: string, data: Partial<Restaurant>): Promise<Restaurant> {
    const restaurant = await this.restaurantModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }

  async remove(id: string): Promise<{ message: string }> {
    const restaurant = await this.restaurantModel.findByIdAndDelete(id).exec();
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return { message: 'Restaurant deleted successfully' };
  }

  async addStockItem(restaurantId: string, item: StockItem): Promise<Restaurant> {
    const restaurant = await this.restaurantModel.findByIdAndUpdate(
      restaurantId,
      { $push: { stock: item } },
      { new: true },
    );
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }

  async updateStockQuantity(
    restaurantId: string,
    itemName: string,
    quantity: number,
  ): Promise<{ updatedItem: StockItem; lowStock: boolean }> {
    const restaurant = await this.restaurantModel.findOneAndUpdate(
      { _id: restaurantId, 'stock.name': itemName },
      {
        $set: { 'stock.$.quantity': quantity },
      },
      { new: true },
    );

    if (!restaurant) throw new NotFoundException('Restaurant or item not found');

    const item = restaurant.stock.find(i => i.name === itemName);
    const lowStock = item.quantity <= 5; // Default threshold

    return { updatedItem: item, lowStock };
  }

  async getStock(restaurantId: string): Promise<StockItem[]> {
    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant.stock || [];
  }

  async getDashboard(restaurantId: string, lowStockThreshold: number = 5) {
    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const stock = restaurant.stock.map(item => ({
      name: item.name,
      description: item.description,
      originalPrice: item.originalPrice,
      discountedPrice: item.discountedPrice,
      quantity: item.quantity,
      category: item.category,
      pickupStartTime: item.pickupStartTime,
      pickupEndTime: item.pickupEndTime,
      photo: item.photo,
      lowStock: item.quantity && item.quantity <= lowStockThreshold,
    }));

    const lowStockAlerts = stock.filter(item => item.lowStock).map(item => item.name);

    return {
      restaurantId: restaurant._id,
      name: restaurant.name,
      stock,
      lowStockAlerts,
    };
  }
}
