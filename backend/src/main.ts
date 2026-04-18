import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // 全局前缀
  app.setGlobalPrefix('api');

  // 启用CORS（允许微信小程序请求）
  app.enableCors({
    origin: true, // 实际生产环境应指定域名
    credentials: true,
  });

  // Swagger API文档
  const config = new DocumentBuilder()
    .setTitle('政企制服采购商城 API')
    .setDescription('微信小程序商城后端API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`API文档: ${await app.getUrl()}/api/docs`);
}
bootstrap();