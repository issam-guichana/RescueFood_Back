// src/restaurants/schemas/item.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ItemCategory {
  PRIMARY = 'produit_primaire',
  PLAT = 'plat',
  DESSERT = 'dessert',
  BOISSON = 'boisson',
}

@Schema({ timestamps: true })
export class Item extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ enum: ItemCategory, required: true })
  category: ItemCategory;

  @Prop({ required: true })
  quantity: number;

  @Prop({ default: 0 })
  sold: number;

  @Prop({ default: 0 })
  donated: number;

  // Pricing and availability
  @Prop({ default: false })
  isFree: boolean; // true = for charity (free), false = for sale

  @Prop({ required: true })
  price: number; // Original price (required even if free)

  @Prop()
  discountedPrice: number; // Optional discounted price for sale

  @Prop({ default: true })
  isAvailable: boolean; // Restaurant can mark as available/unavailable

  // Pickup time window
  @Prop()
  pickupStartTime: Date;

  @Prop()
  pickupEndTime: Date;

  @Prop()
  photo: string;

  // Owner tracking
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId; // The user (restaurant) who created this item

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: Types.ObjectId;

  @Prop({ default: 5 }) // seuil minimum pour alerte
  lowStockThreshold: number;

  @Prop({ default: new Date() })
  lastUpdated: Date;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
