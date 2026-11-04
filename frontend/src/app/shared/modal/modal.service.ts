import { Injectable, signal } from '@angular/core';

export type TipoModal = 'exito' | 'error' | 'info' | 'confirmacion';

export interface DatosModal {
  tipo: TipoModal;
  titulo: string;
  mensaje: string;
  textoBoton?: string;
  textoCancelar?: string;
  alCerrar?: () => void;
  alCancelar?: () => void;
}


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


  cerrar(): void {
    const datos = this.actual();
    this.actual.set(null);
    datos?.alCerrar?.();
  }


  cancelar(): void {
    const datos = this.actual();
    this.actual.set(null);
    datos?.alCancelar?.();
  }


  descartar(): void {
    if (this.actual()?.alCancelar) this.cancelar();
    else this.cerrar();
  }
}
