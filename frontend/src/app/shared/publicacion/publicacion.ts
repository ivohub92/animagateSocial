import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, mensajeDeError } from '../../core/auth.service';
import { EstadoMeGusta, Publicacion } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { Avatar } from '../avatar/avatar';
import { Comentarios } from '../comentarios/comentarios';
import { Estrellas } from '../estrellas/estrellas';
import { Icono } from '../icono/icono';
import { ModalService } from '../modal/modal.service';
import { TiempoRelativoPipe } from '../pipes/tiempo-relativo.pipe';


@Component({
  selector: 'app-publicacion',
  imports: [RouterLink, Avatar, TiempoRelativoPipe, Icono, Estrellas, Comentarios],
  templateUrl: './publicacion.html',
  styleUrl: './publicacion.scss',
})
export class PublicacionCard {
  private readonly auth = inject(AuthService);
  private readonly servicio = inject(PublicacionesService);
  private readonly modal = inject(ModalService);

  readonly publicacion = input.required<Publicacion>();

  readonly acento = input<'rosa' | 'cyan'>('rosa');
  /** Versión grande, para la página de la publicación: comentarios completos con "Cargar más". */
  readonly grande = input(false);

  readonly eliminada = output<string>();

  readonly meGustaCambio = output<EstadoMeGusta>();


  protected readonly meGusta = linkedSignal(() => ({
    cantidad: this.publicacion().cantidadMeGusta,
    porMi: this.publicacion().meGustaPorMi,
  }));
  protected readonly procesando = signal(false);

  readonly comentariosAbiertos = input(false);
  protected readonly mostrarComentarios = linkedSignal(() => this.comentariosAbiertos());

  protected readonly cantidadComentarios = linkedSignal(() => this.publicacion().cantidadComentarios ?? 0);

  protected readonly logueado = this.auth.logueado;
  protected readonly esMia = computed(
    () => this.publicacion().usuario?._id === this.auth.usuario()?._id,
  );
  protected readonly esAdmin = computed(() => this.auth.usuario()?.perfil === 'administrador');
  protected readonly puedeEliminar = computed(() => this.esMia() || this.esAdmin());
  /** Un administrador dando de baja una publicación ajena (Sprint 4): otro botón y otro aviso. */
  protected readonly bajaDeAdmin = computed(() => !this.esMia() && this.esAdmin());

  protected alternarMeGusta(): void {
    if (!this.logueado() || this.procesando()) return;
    const anterior = this.meGusta();
    const dar = !anterior.porMi;
    this.meGusta.set({ cantidad: anterior.cantidad + (dar ? 1 : -1), porMi: dar });
    this.procesando.set(true);

    const id = this.publicacion()._id;
    (dar ? this.servicio.darMeGusta(id) : this.servicio.quitarMeGusta(id)).subscribe({
      next: (estado) => {
        this.meGusta.set({ cantidad: estado.cantidadMeGusta, porMi: estado.meGustaPorMi });
        this.procesando.set(false);
        this.meGustaCambio.emit(estado);
      },
      error: (err) => {
        this.meGusta.set(anterior);
        this.procesando.set(false);
        this.modal.error('No se pudo actualizar el me gusta', mensajeDeError(err));
      },
    });
  }

  protected async eliminar(): Promise<void> {
    const p = this.publicacion();
    const admin = this.bajaDeAdmin();
    const confirmado = admin
      ? await this.modal.confirmar(
          'Dar de baja la publicación',
          `Como administrador vas a dar de baja "${p.titulo}", de @${p.usuario.nombreUsuario}. ` +
            'Va a dejar de estar disponible, junto con sus comentarios.',
          'Dar de baja',
        )
      : await this.modal.confirmar(
          'Eliminar publicación',
          `¿Querés eliminar "${p.titulo}"? También se van sus comentarios. Esta acción no se puede deshacer.`,
          'Eliminar',
        );
    if (!confirmado) return;

    this.procesando.set(true);
    this.servicio.eliminar(this.publicacion()._id).subscribe({
      next: () => {
        this.procesando.set(false);
        this.modal.exito(
          admin ? 'Publicación dada de baja' : 'Publicación eliminada',
          'La publicación y sus comentarios ya no están disponibles.',
        );
        this.eliminada.emit(this.publicacion()._id);
      },
      error: (err) => {
        this.procesando.set(false);
        this.modal.error('No se pudo eliminar', mensajeDeError(err));
      },
    });
  }
}
