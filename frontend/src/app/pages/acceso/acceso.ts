import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CargadorService } from '../../shared/cargador/cargador.service';
import { Icono } from '../../shared/icono/icono';
import { LoginForm } from './login-form/login-form';
import { RegistroForm } from './registro-form/registro-form';

export type Pestana = 'login' | 'registro';

/** Lo que dura la pantalla de carga con la mascota al cambiar de pestaña (como en el diseño). */
const DURACION_CARGA_MS = 450;


@Component({
  selector: 'app-acceso',
  imports: [Icono, LoginForm, RegistroForm],
  templateUrl: './acceso.html',
  styleUrl: './acceso.scss',
})
export class Acceso {
  private readonly router = inject(Router);
  private readonly cargador = inject(CargadorService);

  /** Query param ?tab=… (llega por withComponentInputBinding). */
  readonly tab = input<string>();

  protected readonly pestana = computed<Pestana>(() =>
    this.tab() === 'registro' ? 'registro' : 'login',
  );

  /** Foto elegida en el registro: reemplaza a la mascota del panel izquierdo. */
  protected readonly fotoElegida = signal<string | null>(null);

  /** Mientras se cambia de pestaña se muestra la pantalla de carga con KIRA-BOT. */
  private readonly cargando = signal(false);
  private temporizador?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.temporizador);
      if (this.cargando()) this.cargador.ocultar();
    });
  }

  protected cambiar(pestana: Pestana): void {
    if (pestana === this.pestana() || this.cargando()) return;
    this.cargando.set(true);
    this.cargador.mostrar('CARGANDO...');
    this.temporizador = setTimeout(() => {
      this.fotoElegida.set(null);
      this.router.navigate([], {
        queryParams: { tab: pestana === 'registro' ? 'registro' : null },
        replaceUrl: true,
      });
      this.cargando.set(false);
      this.cargador.ocultar();
    }, DURACION_CARGA_MS);
  }
}
