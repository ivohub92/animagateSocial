import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isValidObjectId } from 'mongoose';
import { PayloadToken, SESION_INVALIDA, SIN_SESION, tokenDelHeader } from '../auth/token.js';
import { UserDocument } from '../users/schemas/user.schema.js';
import { UsersService } from '../users/users.service.js';

type RequestConUsuario = { headers: Record<string, string | undefined>; usuario?: UserDocument };

/**
 * Lee el token JWT del header Authorization, lo verifica (firma y vencimiento) y busca al
 * usuario. Devuelve null si no hay token o no sirve.
 */
async function usuarioDelToken(
  req: RequestConUsuario,
  jwt: JwtService,
  usuarios: UsersService,
): Promise<{ usuario: UserDocument | null; habiaToken: boolean }> {
  const token = tokenDelHeader(req.headers.authorization);
  if (!token) return { usuario: null, habiaToken: false };
  try {
    const payload = await jwt.verifyAsync<PayloadToken>(token);
    const usuario = isValidObjectId(payload.sub) ? await usuarios.findById(payload.sub) : null;
    return { usuario: usuario?.activo ? usuario : null, habiaToken: true };
  } catch {
    return { usuario: null, habiaToken: true }; // firma inválida o token vencido
  }
}

/** Exige un token válido de un usuario activo; si no, responde 401. */
@Injectable()
export class UsuarioActualGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestConUsuario>();
    const { usuario, habiaToken } = await usuarioDelToken(req, this.jwt, this.usersService);
    if (!usuario) throw new UnauthorizedException(habiaToken ? SESION_INVALIDA : SIN_SESION);
    req.usuario = usuario;
    return true;
  }
}

/**
 * Para rutas públicas que cambian un poco si hay sesión (por ejemplo, meGustaPorMi en el
 * listado): si el token sirve deja el usuario; si no, sigue sin usuario y nunca responde 401.
 */
@Injectable()
export class UsuarioOpcionalGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestConUsuario>();
    req.usuario = (await usuarioDelToken(req, this.jwt, this.usersService)).usuario ?? undefined;
    return true;
  }
}

/** Inyecta en el método del controlador el usuario que dejó el guard. */
export const UsuarioActual = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<RequestConUsuario>().usuario,
);
