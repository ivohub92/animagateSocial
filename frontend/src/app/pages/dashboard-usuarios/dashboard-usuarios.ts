import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService, mensajeDeError } from '../../core/auth.service';
import { Usuario } from '../../core/models';
import { UsuariosService } from '../../core/usuarios.service';
import { Avatar } from '../../shared/avatar/avatar';
import { Icono } from '../../shared/icono/icono';
import { ModalService } from '../../shared/modal/modal.service';
import { DashboardTabs } from '../../shared/dashboard-tabs/dashboard-tabs';
import { RegistroForm } from '../acceso/registro-form/registro-form';
import { NombreCompletoPipe } from '../../shared/pipes/nombre-completo.pipe';

/**
 * Panel de administración (Sprint 4, solo administradores): listado de usuarios, alta con el
 * mismo formulario del registro (eligiendo el perfil) y baja / alta lógica de cada usuario.
 */
@Component({
  selector: 'app-dashboard-usuarios',
  imports: [DatePipe, Avatar, Icono, RegistroForm, DashboardTabs, NombreCompletoPipe],
  templateUrl: './dashboard-usuarios.html',
  styleUrl: './dashboard-usuarios.scss',
})
export class DashboardUsuarios implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly servicio = inject(UsuariosService);
  private readonly modal = inject(ModalService);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly mostrarFormulario = signal(false);
  /** Usuario al que se le está cambiando el estado (para deshabilitar su botón mientras tanto). */
  protected readonly procesandoId = signal<string | null>(null);

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

  /** El formulario avisa el usuario creado: se suma arriba de la lista. */
  protected alCrear(usuario: Usuario): void {
    this.usuarios.update((lista) => [usuario, ...lista]);
    this.mostrarFormulario.set(false);
  }

  /** Baja lógica, con confirmación: el usuario no va a poder ingresar. */
  protected async deshabilitar(u: Usuario): Promise<void> {
    const confirmado = await this.modal.confirmar(
      'Deshabilitar usuario',
      `@${u.nombreUsuario} no va a poder ingresar a AnimeGate hasta que lo vuelvas a habilitar. ` +
        'Si intenta iniciar sesión, se le va a avisar que no está autorizado.',
      'Deshabilitar',
    );
    if (confirmado) this.cambiarEstado(u, 'deshabilitar');
  }

  /** Alta lógica: vuelve a poder usar la aplicación. */
  protected habilitar(u: Usuario): void {
    this.cambiarEstado(u, 'habilitar');
  }

  private cambiarEstado(u: Usuario, accion: 'deshabilitar' | 'habilitar'): void {
    this.procesandoId.set(u._id);
    this.servicio[accion](u._id).subscribe({
      next: (actualizado) => {
        this.usuarios.update((lista) => lista.map((x) => (x._id === actualizado._id ? actualizado : x)));
        this.procesandoId.set(null);
        this.modal.exito(
          accion === 'habilitar' ? 'Usuario habilitado' : 'Usuario deshabilitado',
          accion === 'habilitar'
            ? `@${u.nombreUsuario} ya puede volver a ingresar.`
            : `@${u.nombreUsuario} ya no puede ingresar a la aplicación.`,
        );
      },
      error: (err) => {
        this.procesandoId.set(null);
        this.modal.error('No se pudo cambiar el estado', mensajeDeError(err));
      },
    });
  }
}
