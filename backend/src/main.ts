import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createServer } from 'node:http';
import { AppModule } from './app.module.js';
import { opcionesCors } from './common/cors.js';

const PORT = process.env.PORT ?? 3000;

async function bootstrap() {
  // abortOnError: false → si algo falla al iniciar, se lanza el error en vez de cortar el proceso.
  const app = await NestFactory.create(AppModule, { abortOnError: false });

  // Solo el front (CORS_ORIGIN) puede llamar a la API desde el navegador.
  app.enableCors(opcionesCors);

  // Valida todos los DTOs: descarta propiedades desconocidas y responde 400 si algo no cumple.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(PORT);
}

/**
 * Si la aplicación no puede iniciar (por ejemplo, no conecta a MongoDB), se levanta un
 * servidor mínimo que responde 503 explicando el motivo, con las credenciales ocultas.
 * Así el error se ve en el navegador sin tener que buscarlo en los logs del hosting.
 */
function servirDiagnostico(err: unknown) {
  const detalle = (err instanceof Error ? err.message : String(err)).replace(
    /\/\/[^@\s/]+@/g,
    '//***:***@',
  );
  console.error('No se pudo iniciar la aplicación:', detalle);

  const cuerpo = JSON.stringify({
    statusCode: 503,
    error: 'El backend no pudo iniciar',
    detalle,
    variablesDefinidas: {
      MONGODB_URI: Boolean(process.env.MONGODB_URI),
      CORS_ORIGIN: Boolean(process.env.CORS_ORIGIN),
    },
  });
  createServer((_req, res) => {
    res.writeHead(503, { 'content-type': 'application/json; charset=utf-8' });
    res.end(cuerpo);
  }).listen(PORT);
}

try {
  await bootstrap();
} catch (err) {
  servirDiagnostico(err);
}
