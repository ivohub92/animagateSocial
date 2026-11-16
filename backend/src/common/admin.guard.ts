import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Perfil, UserDocument } from '../users/schemas/user.schema.js';


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
