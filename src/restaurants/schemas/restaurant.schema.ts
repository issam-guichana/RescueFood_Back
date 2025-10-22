import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RestaurantDocument = Restaurant & Document;

@Schema()
export class StockItem {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  originalPrice: number;

  @Prop()
  discountedPrice: number;

  @Prop()
  quantity: number;

  @Prop()
  category: string;

  @Prop()
  pickupStartTime: Date;

  @Prop()
  pickupEndTime: Date;

  @Prop()
  photo: string;
}

export const StockItemSchema = SchemaFactory.createForClass(StockItem);

@Schema({ timestamps: true })
export class Restaurant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ default: [] })
  categories: string[]; // ex: ["Patisserie", "Boissons", "Plats", "Produits primaires"]

  @Prop({ type: [StockItemSchema], default: [] })
  stock: StockItem[]; // Stock complet du restaurant

  @Prop({ default: [] })
  lowStockAlerts: string[]; // Produits proches de rupture
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);
