import { Injectable, signal } from '@angular/core';

export interface DatosCargador {
  /** Texto principal, en mayúsculas con la fuente del tema (ej. "CARGANDO..."). */
  texto: string;
  /** Línea chica opcional debajo (ej. "¡Hola, Ana!"). */
  detalle?: string;
}

/**
 * Pantalla de carga a pantalla completa con KIRA-BOT. Se dibuja una sola vez en
 * app.html (como el modal), así queda por encima de todo sin importar quién la pida.
 */
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
