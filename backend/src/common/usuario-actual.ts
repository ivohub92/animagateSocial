import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { UserDocument } from '../users/schemas/user.schema.js';
import { UsersService } from '../users/users.service.js';

/**
 * Header con el que el front indica qué usuario hace el pedido.
 * Es TEMPORAL (Sprint 2): en el Sprint 3 se reemplaza por el token JWT del header
 * Authorization, y solo cambia este archivo.
 */
export const HEADER_USUARIO = 'x-usuario-id';

type RequestConUsuario = { headers: Record<string, string | undefined>; usuario?: UserDocument };

/** Exige un usuario válido y activo; si no lo hay, responde 401. */
@Injectable()
export class UsuarioActualGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestConUsuario>();
    const id = req.headers[HEADER_USUARIO];
    const usuario = id && isValidObjectId(id) ? await this.usersService.findById(id) : null;
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Tenés que iniciar sesión para hacer esto');
    }
    req.usuario = usuario;
    return true;
  }
}

/** Inyecta en el método del controlador el usuario que dejó el guard. */
export const UsuarioActual = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<RequestConUsuario>().usuario,
);
