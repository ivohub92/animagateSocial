import { Injectable, signal } from '@angular/core';

export type TipoModal = 'exito' | 'error' | 'info' | 'confirmacion';

export interface DatosModal {
  tipo: TipoModal;
  titulo: string;
  mensaje: string;
  textoBoton?: string;
  /** Si se define, el modal muestra un segundo botón para cancelar. */
  textoCancelar?: string;
  alCerrar?: () => void;
  alCancelar?: () => void;
}

/** Reemplaza a alert() y confirm(): cualquier componente puede abrir un modal. */
@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly actual = signal<DatosModal | null>(null);

  abrir(datos: DatosModal): void {
    this.actual.set(datos);
  }

  exito(titulo: string, mensaje: string, alCerrar?: () => void): void {
    this.abrir({ tipo: 'exito', titulo, mensaje, alCerrar });
  }

  error(titulo: string, mensaje: string): void {
    this.abrir({ tipo: 'error', titulo, mensaje });
  }

  confirmar(titulo: string, mensaje: string, textoBoton = 'Confirmar'): Promise<boolean> {
    return new Promise((resolver) =>
      this.abrir({
        tipo: 'confirmacion',
        titulo,
        mensaje,
        textoBoton,
        textoCancelar: 'Cancelar',
        alCerrar: () => resolver(true),
        alCancelar: () => resolver(false),
      }),
    );
  }

  /** Botón principal. */
  cerrar(): void {
    const datos = this.actual();
    this.actual.set(null);
    datos?.alCerrar?.();
  }

  /** Botón Cancelar. */
  cancelar(): void {
    const datos = this.actual();
    this.actual.set(null);
    datos?.alCancelar?.();
  }

  /** Escape o clic afuera: cancela si es una confirmación; si no, cierra. */
  descartar(): void {
    if (this.actual()?.alCancelar) this.cancelar();
    else this.cerrar();
  }
}
