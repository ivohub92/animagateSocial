import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { SesionService } from './core/sesion.service';
import { Navbar } from './layout/navbar/navbar';
import { Cargador } from './shared/cargador/cargador';
import { Modal } from './shared/modal/modal';

/** Pantallas sin barra: el login y la pantalla de carga inicial ('/'). */
const sinNavbar = (url: string) => url === '/' || url.startsWith('/login');

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Modal, Cargador],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  // Se crea al arrancar la app para que el contador de la sesión funcione en todas las pantallas.
  private readonly sesion = inject(SesionService);

  protected readonly mostrarNavbar = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => !sinNavbar(e.urlAfterRedirects)),
    ),
    { initialValue: false },
  );
}
