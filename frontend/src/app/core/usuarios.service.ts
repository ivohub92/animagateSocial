import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from './models';

/** Administración de usuarios (Sprint 4). El back exige un token de administrador. */
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url);
  }

  /** Alta: FormData con los campos del registro + perfil ("usuario" | "administrador"). */
  crear(datos: FormData): Observable<Usuario> {
    return this.http.post<Usuario>(this.url, datos);
  }

  /** Baja lógica: el usuario queda deshabilitado y no puede ingresar. */
  deshabilitar(id: string): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.url}/${id}`);
  }

  /** Alta lógica: vuelve a habilitar a un usuario deshabilitado. */
  habilitar(id: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.url}/${id}/habilitar`, {});
  }
}
