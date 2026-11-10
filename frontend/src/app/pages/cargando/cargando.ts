import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CargadorService } from '../../shared/cargador/cargador.service';

/** Tiempo mínimo en pantalla, para que el spinner se llegue a ver aunque el back responda al toque. */
const MINIMO_MS = 900;

/**
 * Pantalla de carga al iniciar la aplicación: muestra el spinner y valida el token guardado
 * contra POST /auth/autorizar. Si sirve, va a publicaciones; si no (o no hay), al login.
 */
@Component({
  selector: 'app-cargando',
  template: '',
})
export class Cargando implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cargador = inject(CargadorService);

  ngOnInit(): void {
    this.cargador.mostrar('VALIDANDO TU SESIÓN...');
    const inicio = Date.now();
    const ir = (ruta: string) =>
      setTimeout(
        () => this.router.navigateByUrl(ruta, { replaceUrl: true }),
        Math.max(0, MINIMO_MS - (Date.now() - inicio)),
      );

    if (!this.auth.token()) {
      ir('/login');
      return;
    }
    this.auth.autorizar().subscribe({
      next: () => ir('/publicaciones'),
      error: () => {
        this.auth.logout(); // token vencido o inválido: se descarta
        ir('/login');
      },
    });
  }

  ngOnDestroy(): void {
    this.cargador.ocultar();
  }
}
