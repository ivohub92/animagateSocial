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


export const UsuarioActual = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<RequestConUsuario>().usuario,
);
