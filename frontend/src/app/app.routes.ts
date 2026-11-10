import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

export const routes: Routes = [
  {
    // Sprint 3: al iniciar la app se valida el token con un spinner y se redirige.
    path: '',
    pathMatch: 'full',
    title: 'AnimeGate',
    loadComponent: () => import('./pages/cargando/cargando').then((m) => m.Cargando),
  },
  {
    // Login y registro comparten página: son dos pestañas (?tab=registro).
    path: 'login',
    title: 'Acceso · AnimeGate',
    loadComponent: () => import('./pages/acceso/acceso').then((m) => m.Acceso),
  },
  {
    // La antigua página de registro ahora es la pestaña "Registrarse".
    path: 'registro',
    redirectTo: () => inject(Router).createUrlTree(['/login'], { queryParams: { tab: 'registro' } }),
  },
  {
    path: 'publicaciones',
    title: 'Publicaciones · AnimeGate',
    loadComponent: () =>
      import('./pages/publicaciones/publicaciones').then((m) => m.Publicaciones),
  },
  {
    // Sprint 3: una publicación en grande, con todos sus comentarios.
    path: 'publicaciones/:id',
    title: 'Publicación · AnimeGate',
    loadComponent: () =>
      import('./pages/publicacion-detalle/publicacion-detalle').then((m) => m.PublicacionDetalle),
  },
  {
    path: 'mi-perfil',
    title: 'Mi perfil · AnimeGate',
    loadComponent: () => import('./pages/mi-perfil/mi-perfil').then((m) => m.MiPerfil),
  },
  { path: '**', redirectTo: '' },
];
