import { Injectable, signal } from '@angular/core';

export interface DatosCargador {

  texto: string;

  detalle?: string;
}


@Injectable({ providedIn: 'root' })
export class CargadorService {
  readonly actual = signal<DatosCargador | null>(null);

  mostrar(texto: string, detalle?: string): void {
    this.actual.set({ texto, detalle });
  }

  ocultar(): void {
    this.actual.set(null);
  }
}
