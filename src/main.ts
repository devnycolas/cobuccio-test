import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração de prefixo global para todas as rotas
  app.setGlobalPrefix('api');

  // Configuração global de pipes para validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Carteira Financeira')
    .setDescription('API RESTful para gerenciamento de carteira financeira')
    .setVersion('1.0')
    .addTag('users', 'Operações relacionadas a usuários')
    .addTag('wallet', 'Operações relacionadas à carteira')
    .addTag('transactions', 'Operações relacionadas a transações')
    .addTag('health', 'Verificação de saúde da aplicação')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Configuração de CORS
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error) =>
  console.error('Application failed to start:', error),
);
