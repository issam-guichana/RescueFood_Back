import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { OrdersModule } from './orders/orders.module';
import config from './config/config';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Module({
  imports: [
    // ---------------- CONFIGURATION ----------------
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [config],
    }),

    // ---------------- MONGODB ----------------
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('database.connectionString') || 'mongodb://localhost:27017/foodRescue';
        console.log('🔌 Connecting to MongoDB:', uri);
        return {
          uri,
          useNewUrlParser: true,
          useUnifiedTopology: true,
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              console.log('✅ MongoDB connected successfully');
            });
            connection.on('disconnected', () => {
              console.log('❌ MongoDB disconnected');
            });
            connection.on('error', (error) => {
              console.error('❌ MongoDB connection error:', error);
            });
            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),

    // ---------------- JWT ----------------
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'SECRET_KEY',
        signOptions: { expiresIn: '10h' },
      }),
      inject: [ConfigService],
      global: true,
    }),

    // ---------------- MODULES ----------------
    AuthModule,
    RolesModule,
    RestaurantsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
