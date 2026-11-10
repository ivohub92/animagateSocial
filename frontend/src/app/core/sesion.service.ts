import { Injectable, effect, inject } from '@angular/core';
import { ModalService } from '../shared/modal/modal.service';
import { AuthService } from './auth.service';

/** El token dura 15 minutos: se avisa cuando quedan 5, o sea a los 10 de iniciar sesión. */
const AVISO_ANTES_MS = 5 * 60 * 1000;

/**
 * Contador de la sesión. Cada vez que hay un token nuevo (login, registro o refresco) programa
 * el aviso; si el usuario acepta extender, se refresca el token y el contador vuelve a empezar.
 * Si no acepta, el token vence a los 15 minutos y el próximo pedido (401) lo lleva al login.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private temporizador?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      clearTimeout(this.temporizador);
      const vence = this.auth.vencimiento();
      if (!vence) return; // sin sesión: no hay nada que contar

      if (vence <= Date.now()) return; // ya venció: lo resuelve el 401 del próximo pedido

      // Se calcula desde el vencimiento del token, así también funciona después de recargar.
      const espera = vence - AVISO_ANTES_MS - Date.now();
      this.temporizador = setTimeout(() => this.avisar(), Math.max(0, espera));
    });
  }

  private async avisar(): Promise<void> {
    const extender = await this.modal.confirmar(
      'Tu sesión está por vencer',
      'Quedan 5 minutos de sesión. ¿Querés extenderla?',
      'Extender sesión',
      'info',
      'No, gracias',
    );
    if (!extender || !this.auth.token()) return;
    this.auth.refrescar().subscribe({
      error: () => {
        // Si el token ya no servía, el interceptor maneja el 401 y lleva al login.
      },
    });
  }
}
