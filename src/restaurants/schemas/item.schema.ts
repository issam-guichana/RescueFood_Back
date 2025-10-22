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

  @Prop({ enum: ItemCategory, required: true })
  category: ItemCategory;

  @Prop({ required: true })
  quantity: number;

  @Prop({ default: 0 })
  sold: number;

  @Prop({ default: 0 })
  donated: number;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: string;



@Prop({ default: 5 }) // seuil minimum pour alerte
lowStockThreshold: number;

@Prop({ default: new Date() })
lastUpdated: Date;

}

export const ItemSchema = SchemaFactory.createForClass(Item);
