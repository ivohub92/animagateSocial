import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ModalService } from '../shared/modal/modal.service';
import { AuthService } from './auth.service';

/**
 * Solo deja entrar a administradores. Es una comodidad del front (no mostrar una página que no
 * van a poder usar): la protección real es el AdminGuard del back, que responde 403.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.usuario()?.perfil === 'administrador' && auth.token()) return true;

  if (!auth.logueado()) return router.createUrlTree(['/login']);
  inject(ModalService).abrir({
    tipo: 'info',
    titulo: 'Solo para administradores',
    mensaje: 'El panel de usuarios está disponible únicamente para cuentas con perfil administrador.',
  });
  return router.createUrlTree(['/publicaciones']);
};
