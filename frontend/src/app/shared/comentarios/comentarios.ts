import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, mensajeDeError } from '../../core/auth.service';
import { Comentario } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { Avatar } from '../avatar/avatar';
import { Icono } from '../icono/icono';
import { ModalService } from '../modal/modal.service';
import { TiempoRelativoPipe } from '../pipes/tiempo-relativo.pipe';

const MAX_CARACTERES = 500;

/** Lista de comentarios de una publicación (los más recientes primero) y el campo para comentar. */
@Component({
  selector: 'app-comentarios',
  imports: [ReactiveFormsModule, Avatar, Icono, TiempoRelativoPipe],
  templateUrl: './comentarios.html',
  styleUrl: './comentarios.scss',
})
export class Comentarios implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly servicio = inject(PublicacionesService);
  private readonly modal = inject(ModalService);

  readonly publicacionId = input.required<string>();
  /** Se emite con el comentario nuevo, para que la tarjeta actualice su contador. */
  readonly comentado = output<Comentario>();

  protected readonly comentarios = signal<Comentario[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly maximo = MAX_CARACTERES;

  protected readonly mensaje = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(MAX_CARACTERES)],
  });
  protected readonly texto = toSignal(this.mensaje.valueChanges, { initialValue: '' });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.listarComentarios(this.publicacionId()).subscribe({
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
}
