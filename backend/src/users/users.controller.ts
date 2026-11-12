import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../common/admin.guard.js';
import { imageUploadOptions } from '../common/image-upload.js';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';
import { UsuarioActual, UsuarioActualGuard } from '../common/usuario-actual.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { Perfil } from './schemas/user.schema.js';
import type { UserDocument } from './schemas/user.schema.js';
import { UsersService } from './users.service.js';

/**
 * Administración de usuarios (Sprint 4). Los dos guards valen para todas las rutas:
 * UsuarioActualGuard verifica el token (401) y AdminGuard que sea de un administrador (403).
 */
@Controller('usuarios')
@UseGuards(UsuarioActualGuard, AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /usuarios → 200 con todos los usuarios (sin contraseña) */
  @Get()
  listar() {
    return this.usersService.listar();
  }

  /**
   * POST /usuarios (multipart, mismos campos que el registro + perfil "usuario" | "administrador")
   * → 201 con el usuario creado; 400 datos inválidos; 409 correo o usuario repetido
   */
  @Post()
  @UseInterceptors(FileInterceptor('imagenPerfil', imageUploadOptions))
  async crear(@Body() dto: CrearUsuarioDto, @UploadedFile() imagen?: Express.Multer.File) {
    const usuario = await this.usersService.registrar(dto, imagen, dto.perfil ?? Perfil.Usuario);
    return usuario.toJSON();
  }

  /** DELETE /usuarios/:id → 200 baja lógica (deshabilitado); 404 no existe; 409 ya estaba; 400 si sos vos */
  @Delete(':id')
  deshabilitar(@Param('id', ParseObjectIdPipe) id: string, @UsuarioActual() admin: UserDocument) {
    return this.usersService.deshabilitar(id, admin);
  }

  /** POST /usuarios/:id/habilitar → 200 alta lógica (rehabilitado); 404 no existe; 409 ya estaba habilitado */
  @Post(':id/habilitar')
  @HttpCode(HttpStatus.OK)
  habilitar(@Param('id', ParseObjectIdPipe) id: string) {
    return this.usersService.habilitar(id);
  }
}
