import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module.js';
import { ComentariosController } from './comentarios.controller.js';
import { ComentariosService } from './comentarios.service.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';
import { Comentario, ComentarioSchema } from './schemas/comentario.schema.js';
import { Publicacion, PublicacionSchema } from './schemas/publicacion.schema.js';

@Module({
  imports: [
    UsersModule, // UsuarioActualGuard usa UsersService
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
    ]),
  ],
  controllers: [PublicacionesController, ComentariosController],
  providers: [PublicacionesService, ComentariosService],
})
export class PublicacionesModule {}
