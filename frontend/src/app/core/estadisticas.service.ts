import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Lapso de las estadísticas: desde incluido, hasta excluido (ISO), y la zona horaria del navegador. */
export interface Lapso {
  desde: string;
  hasta: string;
  zona: string;
}

export interface PublicacionesPorUsuario {
  total: number;
  items: { usuario: { _id: string; nombre: string; apellido: string; nombreUsuario: string }; cantidad: number }[];
}

export interface ComentariosPorDia {
  total: number;
  dias: { fecha: string; cantidad: number }[];
}

export interface ComentariosPorPublicacion {
  total: number;
  items: { publicacion: { _id: string; titulo: string; autor: string | null }; cantidad: number }[];
}

/** Estadísticas del dashboard (Sprint 4). El back exige un token de administrador. */
@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/estadisticas`;

  publicacionesPorUsuario(lapso: Lapso): Observable<PublicacionesPorUsuario> {
    return this.http.get<PublicacionesPorUsuario>(`${this.url}/publicaciones-por-usuario`, { params: this.params(lapso) });
  }

  comentariosPorDia(lapso: Lapso): Observable<ComentariosPorDia> {
    return this.http.get<ComentariosPorDia>(`${this.url}/comentarios-por-dia`, { params: this.params(lapso) });
  }

  comentariosPorPublicacion(lapso: Lapso): Observable<ComentariosPorPublicacion> {
    return this.http.get<ComentariosPorPublicacion>(`${this.url}/comentarios-por-publicacion`, {
      params: this.params(lapso),
    });
  }

  private params({ desde, hasta, zona }: Lapso): HttpParams {
    return new HttpParams().set('desde', desde).set('hasta', hasta).set('zona', zona);
  }
}
