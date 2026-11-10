import { UnauthorizedException } from '@nestjs/common';
import type { Perfil } from '../users/schemas/user.schema.js';

/** Lo que viaja dentro del token: quién es el usuario y su rol. */
export interface PayloadToken {
  sub: string; // id del usuario
  correo: string;
  nombreUsuario: string;
  perfil: Perfil;
}

/** El token vence a los 15 minutos (lo pide el TP). */
export const VENCIMIENTO_TOKEN = '15m';

export const SIN_SESION = 'Tenés que iniciar sesión para hacer esto';
export const SESION_INVALIDA = 'La sesión venció o no es válida. Volvé a iniciar sesión.';

/** Saca el token del header "Authorization: Bearer <token>"; si no está, devuelve null. */
export function tokenDelHeader(authorization?: string): string | null {
  const [tipo, token] = (authorization ?? '').split(' ');
  return tipo?.toLowerCase() === 'bearer' && token ? token : null;
}

/** Igual que tokenDelHeader, pero responde 401 si no vino el token. */
export function tokenObligatorio(authorization?: string): string {
  const token = tokenDelHeader(authorization);
  if (!token) throw new UnauthorizedException(SIN_SESION);
  return token;
}
