import { Directive, effect, inject, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/auth.service';

/**
 * Directiva estructural: muestra el elemento solo si quien está logueado es administrador.
 * Si la sesión cambia (login, logout, otro usuario), aparece o desaparece sola.
 *   <a *appSoloAdmin routerLink="/dashboard/usuarios">Dashboard</a>
 */
@Directive({ selector: '[appSoloAdmin]' })
export class SoloAdminDirective {
  private readonly auth = inject(AuthService);
  private readonly plantilla = inject(TemplateRef<unknown>);
  private readonly contenedor = inject(ViewContainerRef);
  private visible = false;

  constructor() {
    effect(() => {
      const esAdmin = this.auth.usuario()?.perfil === 'administrador';
      if (esAdmin && !this.visible) this.contenedor.createEmbeddedView(this.plantilla);
      if (!esAdmin && this.visible) this.contenedor.clear();
      this.visible = esAdmin;
    });
  }
}
