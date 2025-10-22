import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { Restaurant, RestaurantSchema } from './schemas/restaurant.schema';
import { Item, ItemSchema } from './schemas/item.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Item.name, schema: ItemSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RestaurantsController, ItemsController],
  providers: [RestaurantsService, ItemsService],
  exports: [RestaurantsService, ItemsService],
})
export class RestaurantsModule {}
