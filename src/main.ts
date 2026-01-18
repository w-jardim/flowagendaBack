import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { InjectProfissionalIdInterceptor } from './shared/interceptors/inject-profissional-id.interceptor';
import { seedAdmin } from './scripts/seed-admin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  // Habilita transformação dos DTOs e retorna erros detalhados ao frontend
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new BadRequestException(errors),
    }),
  );

  // Filtro global para log detalhado de erros (incluindo validação)
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptor global: injeta profissional_id e normaliza campos antes da validação
  app.useGlobalInterceptors(new InjectProfissionalIdInterceptor());

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // front em dev
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true, // se você usa cookies/autenticação com credenciais
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  // Optional: seed admin on startup when explicitly requested
  if (process.env.SEED_ADMIN_ON_STARTUP === 'true') {
    try {
      // ensure admin exists before starting to listen
      await seedAdmin();
      console.log('Seed admin executed at startup (SEED_ADMIN_ON_STARTUP=true)');
    } catch (err) {
      console.error('Error seeding admin at startup:', err);
    }
  }

  await app.listen(port);
  console.log(`Nest running on http://localhost:${port}`);
}
bootstrap();