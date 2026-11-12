import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Perfil, UserDocument } from '../users/schemas/user.schema.js';

/**
 * Solo deja pasar a administradores. Va siempre después de UsuarioActualGuard, que ya verificó
 * el token y dejó el usuario en el request:
 *   @UseGuards(UsuarioActualGuard, AdminGuard)
 * Sin token o con un token vencido responde 401 el primero; con un usuario común, 403 este.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const usuario = context.switchToHttp().getRequest<{ usuario?: UserDocument }>().usuario;
    if (usuario?.perfil !== Perfil.Administrador) {
      throw new ForbiddenException('Solo un administrador puede hacer esto');
    }
    return true;
  }
}
