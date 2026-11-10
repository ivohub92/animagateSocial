import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Comentario,
  EstadoMeGusta,
  OrdenPublicaciones,
  PaginaComentarios,
  PaginaPublicaciones,
  Publicacion,
} from './models';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/publicaciones`;

 
  listar(
    orden: OrdenPublicaciones,
    offset: number,
    limit: number,
    usuario?: string,
  ): Observable<PaginaPublicaciones> {
    let params = new HttpParams().set('orden', orden).set('offset', offset).set('limit', limit);
    if (usuario) params = params.set('usuario', usuario);
    return this.http.get<PaginaPublicaciones>(this.url, { params });
  }


  crear(datos: FormData): Observable<Publicacion> {
    return this.http.post<Publicacion>(this.url, datos);
  }

  eliminar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.url}/${id}`);
  }

  darMeGusta(id: string): Observable<EstadoMeGusta> {
    return this.http.post<EstadoMeGusta>(`${this.url}/${id}/me-gusta`, {});
  }

  quitarMeGusta(id: string): Observable<EstadoMeGusta> {
    return this.http.delete<EstadoMeGusta>(`${this.url}/${id}/me-gusta`);
  }

  /** Comentarios de una publicación, los más recientes primero. */
  listarComentarios(id: string, offset = 0, limit = 20): Observable<PaginaComentarios> {
    const params = new HttpParams().set('offset', offset).set('limit', limit);
    return this.http.get<PaginaComentarios>(`${this.url}/${id}/comentarios`, { params });
  }

  comentar(id: string, mensaje: string): Observable<Comentario> {
    return this.http.post<Comentario>(`${this.url}/${id}/comentarios`, { mensaje });
  }

  /** PUT: cambia el mensaje; el back lo devuelve con modificado: true. */
  editarComentario(id: string, idComentario: string, mensaje: string): Observable<Comentario> {
    return this.http.put<Comentario>(`${this.url}/${id}/comentarios/${idComentario}`, { mensaje });
  }

  /** Una publicación sola (para verla en grande). */
  obtener(id: string): Observable<Publicacion> {
    return this.http.get<Publicacion>(`${this.url}/${id}`);
  }
}
