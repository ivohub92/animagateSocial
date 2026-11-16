import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
import { sesionGuard } from './core/sesion.guard';

export const routes: Routes = [
  {

    path: '',
    pathMatch: 'full',
    title: 'AnimeGate',
    loadComponent: () => import('./pages/cargando/cargando').then((m) => m.Cargando),
  },
  {

    path: 'login',
    title: 'Acceso · AnimeGate',
    loadComponent: () => import('./pages/acceso/acceso').then((m) => m.Acceso),
  },
  {

    path: 'registro',
    redirectTo: () => inject(Router).createUrlTree(['/login'], { queryParams: { tab: 'registro' } }),
  },
  {
    path: 'publicaciones',
    title: 'Publicaciones · AnimeGate',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./pages/publicaciones/publicaciones').then((m) => m.Publicaciones),
  },
  {

    path: 'publicaciones/:id',
    title: 'Publicación · AnimeGate',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./pages/publicacion-detalle/publicacion-detalle').then((m) => m.PublicacionDetalle),
  },
  {

    path: 'dashboard/usuarios',
    title: 'Usuarios · AnimeGate',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/dashboard-usuarios/dashboard-usuarios').then((m) => m.DashboardUsuarios),
  },
  {

    path: 'dashboard/estadisticas',
    title: 'Estadísticas · AnimeGate',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/dashboard-estadisticas/dashboard-estadisticas').then((m) => m.DashboardEstadisticas),
  },
  {
    path: 'mi-perfil',
    title: 'Mi perfil · AnimeGate',
    canActivate: [sesionGuard],
    loadComponent: () => import('./pages/mi-perfil/mi-perfil').then((m) => m.MiPerfil),
  },
  { path: '**', redirectTo: '' },
];
