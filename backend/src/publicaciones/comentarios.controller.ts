import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';
import { UsuarioActual, UsuarioActualGuard } from '../common/usuario-actual.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { ComentariosService } from './comentarios.service.js';
import { CrearComentarioDto } from './dto/crear-comentario.dto.js';
import { ListarComentariosDto } from './dto/listar-comentarios.dto.js';

/** Comentarios de una publicación: /publicaciones/:publicacionId/comentarios */
@Controller('publicaciones/:publicacionId/comentarios')
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  /** GET ?offset=0&limit=20 → 200 { items, total, offset, limit }, los más recientes primero; 404 si no existe */
  @Get()
  listar(
    @Param('publicacionId', ParseObjectIdPipe) publicacionId: string,
    @Query() filtros: ListarComentariosDto,
  ) {
    return this.comentariosService.listar(publicacionId, filtros);
  }

  /** POST { mensaje } → 201 con el comentario, su autor y la fecha; 401 sin usuario; 404 si no existe */
  @Post()
  @UseGuards(UsuarioActualGuard)
  crear(
    @Param('publicacionId', ParseObjectIdPipe) publicacionId: string,
    @Body() dto: CrearComentarioDto,
    @UsuarioActual() usuario: UserDocument,
  ) {
    return this.comentariosService.crear(publicacionId, dto, usuario);
  }
}
