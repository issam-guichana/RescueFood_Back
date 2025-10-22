import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  logger.log('🚀 Application starting...');

  // ✅ Autoriser Flutter Web (Chrome) à appeler ton API
  app.enableCors({
    origin: true, // ou mettre ['http://localhost:55894'] si tu veux restreindre
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  logger.log('✅ CORS enabled');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  logger.log('✅ Global validation pipe configured');

  const port = process.env.PORT || 3200;
  await app.listen(port);
  logger.log(`🎉 Application is running on: http://localhost:${port}`);
}
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Failed to start application', error.stack);
  process.exit(1);
});
