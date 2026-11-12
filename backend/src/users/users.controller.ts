import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/admin.guard.js';
import { UsuarioActualGuard } from '../common/usuario-actual.js';
import { UsersService } from './users.service.js';

/** Administración de usuarios (Sprint 4): todas las rutas son solo para administradores. */
@Controller('usuarios')
@UseGuards(UsuarioActualGuard, AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /usuarios → 200 con todos los usuarios (sin contraseña); 401 sin token; 403 si no es admin */
  @Get()
  listar() {
    return this.usersService.listar();
  }
}
