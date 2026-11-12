import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, mensajeDeError } from '../../core/auth.service';
import { Comentario } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { Avatar } from '../avatar/avatar';
import { Icono } from '../icono/icono';
import { ModalService } from '../modal/modal.service';
import { TiempoRelativoPipe } from '../pipes/tiempo-relativo.pipe';
import { NombreCompletoPipe } from '../pipes/nombre-completo.pipe';
import { AutoAlturaDirective } from '../directivas/auto-altura.directive';

const MAX_CARACTERES = 500;

/** Cuántos comentarios se traen por vez en cada modo. */
const POR_PAGINA = { resumen: 3, completo: 5 } as const;

/**
 * Comentarios de una publicación, los más recientes primero, con el campo para comentar.
 * - resumen (feed y Mi perfil): los 3 más recientes y un enlace a la publicación.
 * - completo (página de la publicación): de a 5, con "Cargar más" que agrega los
 *   siguientes debajo sin perder los que ya se ven.
 * Quien escribió un comentario lo puede editar; los editados dicen "editado".
 */
@Component({
  selector: 'app-comentarios',
  imports: [ReactiveFormsModule, RouterLink, Avatar, Icono, TiempoRelativoPipe, NombreCompletoPipe, AutoAlturaDirective],
  templateUrl: './comentarios.html',
  styleUrl: './comentarios.scss',
})
export class Comentarios implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly servicio = inject(PublicacionesService);
  private readonly modal = inject(ModalService);

  readonly publicacionId = input.required<string>();
  readonly modo = input<'resumen' | 'completo'>('resumen');
  /** Se emite con el comentario nuevo, para que la tarjeta actualice su contador. */
  readonly comentado = output<Comentario>();

  protected readonly comentarios = signal<Comentario[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(true);
  protected readonly cargandoMas = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly maximo = MAX_CARACTERES;

  /** Quedan comentarios por traer (los que ya se ven son menos que el total). */
  protected readonly hayMas = computed(() => this.comentarios().length < this.total());

  protected readonly mensaje = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(MAX_CARACTERES)],
  });
  protected readonly texto = toSignal(this.mensaje.valueChanges, { initialValue: '' });

  // Edición: un comentario a la vez.
  protected readonly editandoId = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly edicion = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(MAX_CARACTERES)],
  });
  protected readonly textoEdicion = toSignal(this.edicion.valueChanges, { initialValue: '' });

  ngOnInit(): void {
    this.cargar();
  }

  protected esMio(c: Comentario): boolean {
    return c.usuario._id === this.auth.usuario()?._id;
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.listarComentarios(this.publicacionId(), 0, POR_PAGINA[this.modo()]).subscribe({
      next: (pagina) => {
        this.comentarios.set(pagina.items);
        this.total.set(pagina.total);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  /** Trae la página siguiente y la agrega abajo; los que ya estaban se siguen viendo. */
  protected cargarMas(): void {
    this.cargandoMas.set(true);
    const offset = this.comentarios().length;
    this.servicio.listarComentarios(this.publicacionId(), offset, POR_PAGINA.completo).subscribe({
      next: (pagina) => {
        // Si alguien comentó mientras tanto, la página puede repetir alguno: se descartan.
        const vistos = new Set(this.comentarios().map((c) => c._id));
        this.comentarios.update((lista) => [...lista, ...pagina.items.filter((c) => !vistos.has(c._id))]);
        this.total.set(pagina.total);
        this.cargandoMas.set(false);
      },
      error: (err) => {
        this.cargandoMas.set(false);
        this.modal.error('No se pudieron cargar más comentarios', mensajeDeError(err));
      },
    });
  }

  protected comentar(): void {
    const mensaje = this.mensaje.value.trim();
    if (!mensaje || this.mensaje.invalid) {
      this.mensaje.markAsTouched();
      return;
    }
    this.enviando.set(true);
    this.servicio.comentar(this.publicacionId(), mensaje).subscribe({
      next: (comentario) => {
        // El más nuevo va arriba, igual que el orden que devuelve el back.
        this.comentarios.update((lista) => [comentario, ...lista]);
        this.total.update((n) => n + 1);
        this.mensaje.reset();
        this.enviando.set(false);
        this.comentado.emit(comentario);
      },
      error: (err) => {
        this.enviando.set(false);
        this.modal.error('No se pudo comentar', mensajeDeError(err));
      },
    });
  }

  protected empezarEdicion(c: Comentario): void {
    this.editandoId.set(c._id);
    this.edicion.setValue(c.mensaje);
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
  }

  protected guardarEdicion(c: Comentario): void {
    const mensaje = this.edicion.value.trim();
    if (!mensaje || this.edicion.invalid) return;
    if (mensaje === c.mensaje) {
      this.cancelarEdicion(); // no cambió nada: no hace falta marcarlo como editado
      return;
    }
    this.guardando.set(true);
    this.servicio.editarComentario(this.publicacionId(), c._id, mensaje).subscribe({
      next: (editado) => {
        this.comentarios.update((lista) => lista.map((x) => (x._id === editado._id ? editado : x)));
        this.guardando.set(false);
        this.editandoId.set(null);
      },
      error: (err) => {
        this.guardando.set(false);
        this.modal.error('No se pudo editar el comentario', mensajeDeError(err));
      },
    });
  }
}
