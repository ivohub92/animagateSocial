import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { Avatar } from '../../shared/avatar/avatar';
import { Icono } from '../../shared/icono/icono';
import { NombreCompletoPipe } from '../../shared/pipes/nombre-completo.pipe';
import { SoloAdminDirective } from '../../shared/directivas/solo-admin.directive';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Avatar, Icono, NombreCompletoPipe, SoloAdminDirective],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** "Dashboard" queda marcado en cualquiera de sus pestañas (usuarios o estadísticas). */
  protected readonly enDashboard = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/dashboard')),
    ),
    { initialValue: this.router.url.startsWith('/dashboard') },
  );

  protected salir(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
