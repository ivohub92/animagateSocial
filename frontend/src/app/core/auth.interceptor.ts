import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ModalService } from '../shared/modal/modal.service';
import { AuthService } from './auth.service';

/** Pedidos que responden 401 como parte normal de su trabajo: el 401 lo maneja quien los llama. */
const SIN_REDIRECCION = ['/auth/login', '/auth/registro', '/auth/autorizar'];

/**
 * 1) Agrega "Authorization: Bearer <token>" a cada pedido a la API cuando hay sesión.
 * 2) Si una petición devuelve 401 (token vencido o inválido), cierra la sesión y lleva al
 *    login para volver a obtener un token.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const modal = inject(ModalService);

  const esApi = req.url.startsWith(environment.apiUrl);
  const token = auth.token();
  const pedido = esApi && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(pedido).pipe(
    catchError((err: unknown) => {
      const manejar401 =
        esApi &&
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !SIN_REDIRECCION.some((ruta) => req.url.endsWith(ruta));
      if (manejar401) {
        auth.logout();
        router.navigate(['/login']);
        modal.abrir({
          tipo: 'info',
          titulo: 'Tu sesión venció',
          mensaje: 'Por seguridad, la sesión dura 15 minutos. Iniciá sesión de nuevo para seguir.',
        });
        // Ya está resuelto: se termina el pedido sin error, así ningún componente
        // muestra un segundo modal encima de este aviso.
        return EMPTY;
      }
      return throwError(() => err);
    }),
  );
};
