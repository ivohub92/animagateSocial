import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiError, LoginRequest, Sesion, Usuario } from './models';

const CLAVE_USUARIO = 'usuario';
const CLAVE_TOKEN = 'token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly _usuario = signal<Usuario | null>(leerJson<Usuario>(CLAVE_USUARIO));
  /** Token JWT guardado en el navegador (localStorage), como pide el TP. */
  private readonly _token = signal<string | null>(leer(CLAVE_TOKEN));

  readonly usuario = this._usuario.asReadonly();
  readonly token = this._token.asReadonly();
  readonly logueado = computed(() => this._usuario() !== null && this._token() !== null);
  /** Momento (en ms) en que vence el token, leído de su campo exp. */
  readonly vencimiento = computed(() => vencimientoDe(this._token()));

  registro(datos: FormData): Observable<Usuario> {
    return this.http.post<Sesion>(`${this.url}/registro`, datos).pipe(
      tap((sesion) => this.guardarSesion(sesion)),
      map((sesion) => sesion.usuario),
    );
  }

  login(datos: LoginRequest): Observable<Usuario> {
    return this.http.post<Sesion>(`${this.url}/login`, datos).pipe(
      tap((sesion) => this.guardarSesion(sesion)),
      map((sesion) => sesion.usuario),
    );
  }

  /** Valida el token guardado contra el back y actualiza los datos del usuario. 401 si no sirve. */
  autorizar(): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.url}/autorizar`, {}).pipe(
      tap((usuario) => this.guardarUsuario(usuario)),
    );
  }

  /** Pide un token nuevo (otros 15 minutos) con el token actual. */
  refrescar(): Observable<string> {
    return this.http.post<{ token: string }>(`${this.url}/refrescar`, {}).pipe(
      map(({ token }) => token),
      tap((token) => this.guardarToken(token)),
    );
  }

  logout(): void {
    localStorage.removeItem(CLAVE_USUARIO);
    localStorage.removeItem(CLAVE_TOKEN);
    this._usuario.set(null);
    this._token.set(null);
  }

  private guardarSesion({ usuario, token }: Sesion): void {
    this.guardarToken(token);
    this.guardarUsuario(usuario);
  }

  private guardarUsuario(usuario: Usuario): void {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    this._usuario.set(usuario);
  }

  private guardarToken(token: string): void {
    localStorage.setItem(CLAVE_TOKEN, token);
    this._token.set(token);
  }
}

/** Convierte un error HTTP en un mensaje legible para mostrar en un modal. */
export function mensajeDeError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Intente nuevamente más tarde.';
    }
    const body = err.error as ApiError | null;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join('\n') : body.message;
    }
  }
  return 'Ocurrió un error inesperado.';
}

/**
 * Lee el campo exp del token (la parte del medio es JSON en base64url). Solo sirve para saber
 * cuándo avisar: la validez real del token la decide siempre el back.
 */
function vencimientoDe(token: string | null): number | null {
  try {
    const base64 = token!.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(base64)) as { exp?: number };
    return exp ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function leerJson<T>(clave: string): T | null {
  try {
    const raw = leer(clave);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
