import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageUploadOptions } from '../common/image-upload.js';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';
import {
  UsuarioActual,
  UsuarioActualGuard,
  UsuarioOpcionalGuard,
} from '../common/usuario-actual.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { PublicacionesService } from './publicaciones.service.js';

@Controller('publicaciones')
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  /** GET /publicaciones?orden=fecha|meGusta&offset=0&limit=10&usuario=<id> → 200 (el token es opcional) */
  @Get()
  @UseGuards(UsuarioOpcionalGuard)
  listar(@Query() filtros: ListarPublicacionesDto, @UsuarioActual() usuario?: UserDocument) {
    return this.publicacionesService.listar(filtros, usuario ? String(usuario._id) : undefined);
  }

  /** GET /publicaciones/:id → 200 con una publicación (para verla en grande), 404 si no existe */
  @Get(':id')
  @UseGuards(UsuarioOpcionalGuard)
  obtener(@Param('id', ParseObjectIdPipe) id: string, @UsuarioActual() usuario?: UserDocument) {
    return this.publicacionesService.obtener(id, usuario ? String(usuario._id) : undefined);
  }

  /** POST /publicaciones (multipart: titulo, mensaje, imagen opcional) → 201 */
  @Post()
  @UseGuards(UsuarioActualGuard)
  @UseInterceptors(FileInterceptor('imagen', imageUploadOptions))
  crear(
    @Body() dto: CrearPublicacionDto,
    @UsuarioActual() usuario: UserDocument,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.publicacionesService.crear(dto, usuario, imagen);
  }

  /** DELETE /publicaciones/:id → 200 (baja lógica), 403 si no es el autor ni admin, 404 si no existe */
  @Delete(':id')
  @UseGuards(UsuarioActualGuard)
  eliminar(@Param('id', ParseObjectIdPipe) id: string, @UsuarioActual() usuario: UserDocument) {
    return this.publicacionesService.eliminar(id, usuario);
  }

  /** POST /publicaciones/:id/me-gusta → 201, 409 si ya le había dado me gusta */
  @Post(':id/me-gusta')
  @UseGuards(UsuarioActualGuard)
  darMeGusta(@Param('id', ParseObjectIdPipe) id: string, @UsuarioActual() usuario: UserDocument) {
    return this.publicacionesService.darMeGusta(id, usuario);
  }

  /** DELETE /publicaciones/:id/me-gusta → 200, 409 si no le había dado me gusta */
  @Delete(':id/me-gusta')
  @UseGuards(UsuarioActualGuard)
  quitarMeGusta(@Param('id', ParseObjectIdPipe) id: string, @UsuarioActual() usuario: UserDocument) {
    return this.publicacionesService.quitarMeGusta(id, usuario);
  }
}
