import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService, mensajeDeError } from '../../core/auth.service';
import { Usuario } from '../../core/models';
import { UsuariosService } from '../../core/usuarios.service';
import { Avatar } from '../../shared/avatar/avatar';
import { Icono } from '../../shared/icono/icono';

/** Panel de administración: listado de todos los usuarios (Sprint 4, solo administradores). */
@Component({
  selector: 'app-dashboard-usuarios',
  imports: [DatePipe, Avatar, Icono],
  templateUrl: './dashboard-usuarios.html',
  styleUrl: './dashboard-usuarios.scss',
})
export class DashboardUsuarios implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly servicio = inject(UsuariosService);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly total = computed(() => this.usuarios().length);
  protected readonly administradores = computed(
    () => this.usuarios().filter((u) => u.perfil === 'administrador').length,
  );
  protected readonly deshabilitados = computed(() => this.usuarios().filter((u) => !u.activo).length);

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.listar().subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }
}
