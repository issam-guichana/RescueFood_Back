import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResetTokenDocument = ResetToken & Document;

@Schema({ timestamps: true })
export class ResetToken {
  @Prop({ required: true })
  token: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  expiryDate: Date;
}

export const ResetTokenSchema = SchemaFactory.createForClass(ResetToken);
