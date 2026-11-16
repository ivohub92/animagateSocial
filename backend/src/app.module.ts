import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import type { Connection } from 'mongoose';
import { AuthModule } from './auth/auth.module.js';
import { estadoMongo, ocultarCredenciales } from './common/estado-mongo.js';
import { UPLOADS_DIR } from './common/image-upload.js';
import { PublicacionesModule } from './publicaciones/publicaciones.module.js';
import { SaludController } from './salud.controller.js';
import { UsersModule } from './users/users.module.js';

/** Explica por qué no hay URI de MongoDB (solo muestra nombres de variables, nunca valores). */
function motivoSinUri(): string {
  if ('MONGODB_URI' in process.env) {
    return 'La variable de entorno MONGODB_URI existe pero está vacía.';
  }
  const parecidas = Object.keys(process.env).filter((k) => /mongo|uri/i.test(k));
  return (
    'Falta la variable de entorno MONGODB_URI. ' +
    `Variables con nombre parecido: ${parecidas.join(', ') || 'ninguna'}`
  );
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URI')?.trim();
        return {
          uri,
          lazyConnection: true,
          serverSelectionTimeoutMS: 10_000,
          connectionFactory: (conexion: Connection) => {
            conexion.asPromise().then(
              () => (estadoMongo.ultimoError = null),
              (err: Error) => {
                estadoMongo.ultimoError = uri
                  ? ocultarCredenciales(err.message)
                  : motivoSinUri();
                console.error('No se pudo conectar a MongoDB:', estadoMongo.ultimoError);
              },
            );
            return conexion;
          },
        };
      },
    }),
    // Sirve las imágenes subidas en /uploads/<archivo>
    ServeStaticModule.forRoot({ rootPath: UPLOADS_DIR, serveRoot: '/uploads' }),
    UsersModule,
    AuthModule,
    PublicacionesModule,
  ],
  controllers: [SaludController],
})
export class AppModule {}
