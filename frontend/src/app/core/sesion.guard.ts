import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * "Solo se puede acceder a la aplicación estando registrado o logueado" (enunciado del TP).
 * Sin sesión, cualquier pantalla que no sea el login lleva al login. Si el token guardado ya
 * venció, el back responde 401 y el interceptor hace lo mismo.
 */
export const sesionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.logueado() ? true : inject(Router).createUrlTree(['/login']);
};
