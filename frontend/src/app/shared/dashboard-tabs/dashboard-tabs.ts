import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icono } from '../icono/icono';

/** Pestañas del dashboard de administración: Usuarios y Estadísticas. */
@Component({
  selector: 'app-dashboard-tabs',
  imports: [RouterLink, RouterLinkActive, Icono],
  template: `
    <nav class="tabs glass-panel" aria-label="Secciones del dashboard">
      <a routerLink="/dashboard/usuarios" routerLinkActive="activa" ariaCurrentWhenActive="page">
        <app-icono nombre="usuario" [tam]="15" />
        Usuarios
      </a>
      <a routerLink="/dashboard/estadisticas" routerLinkActive="activa" ariaCurrentWhenActive="page">
        <app-icono nombre="tendencia" [tam]="15" />
        Estadísticas
      </a>
    </nav>
  `,
  styles: `
    .tabs {
      display: flex;
      gap: 6px;
      padding: 6px;
      border-radius: 16px;
    }
    a {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 12px;
      color: #94a3b8;
      font-family: var(--font-heading);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      transition: background 0.2s, color 0.2s;
    }
    a:hover {
      color: #fff;
      text-decoration: none;
      background: rgba(30, 41, 59, 0.5);
    }
    a.activa {
      color: #fff;
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }
  `,
})
export class DashboardTabs {}
