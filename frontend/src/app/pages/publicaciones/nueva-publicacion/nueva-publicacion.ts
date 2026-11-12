import { Component, OnDestroy, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, mensajeDeError } from '../../../core/auth.service';
import { Publicacion } from '../../../core/models';
import { PublicacionesService } from '../../../core/publicaciones.service';
import { Avatar } from '../../../shared/avatar/avatar';
import { Estrellas } from '../../../shared/estrellas/estrellas';
import { Icono } from '../../../shared/icono/icono';
import { ModalService } from '../../../shared/modal/modal.service';
import { AutoAlturaDirective } from '../../../shared/directivas/auto-altura.directive';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGEN_MB = 5;

/** Caja para escribir una publicación nueva: título, mensaje e imagen opcional. */
@Component({
  selector: 'app-nueva-publicacion',
  imports: [ReactiveFormsModule, Avatar, Icono, Estrellas, AutoAlturaDirective],
  templateUrl: './nueva-publicacion.html',
  styleUrl: './nueva-publicacion.scss',
})
export class NuevaPublicacion implements OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly servicio = inject(PublicacionesService);
  private readonly modal = inject(ModalService);

  readonly publicada = output<Publicacion>();

  protected readonly enviando = signal(false);
  protected readonly imagen = signal<File | null>(null);
  protected readonly preview = signal<string | null>(null);
  /** Estrellas de 1 a 5, opcionales (una publicación de debate no las lleva). */
  protected readonly puntaje = signal<number | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    mensaje: ['', [Validators.required, Validators.maxLength(1000)]],
  });
  protected readonly mensaje = toSignal(this.form.controls.mensaje.valueChanges, { initialValue: '' });

  protected invalido(campo: 'titulo' | 'mensaje'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  protected elegirImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    input.value = '';
    if (!archivo) return;
    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      this.modal.error('Imagen no válida', 'La imagen debe ser JPG, PNG, WEBP o GIF.');
      return;
    }
    if (archivo.size > MAX_IMAGEN_MB * 1024 * 1024) {
      this.modal.error('Imagen muy grande', `La imagen no puede superar los ${MAX_IMAGEN_MB} MB.`);
      return;
    }
    this.quitarImagen();
    this.imagen.set(archivo);
    this.preview.set(URL.createObjectURL(archivo));
  }

  protected quitarImagen(): void {
    const url = this.preview();
    if (url) URL.revokeObjectURL(url);
    this.imagen.set(null);
    this.preview.set(null);
  }

  protected publicar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { titulo, mensaje } = this.form.getRawValue();
    const datos = new FormData();
    datos.append('titulo', titulo.trim());
    datos.append('mensaje', mensaje.trim());
    const imagen = this.imagen();
    if (imagen) datos.append('imagen', imagen);
    const puntaje = this.puntaje();
    if (puntaje) datos.append('puntaje', String(puntaje));

    this.enviando.set(true);
    this.servicio.crear(datos).subscribe({
      next: (publicacion) => {
        this.enviando.set(false);
        this.form.reset();
        this.quitarImagen();
        this.puntaje.set(null);
        this.publicada.emit(publicacion);
      },
      error: (err) => {
        this.enviando.set(false);
        this.modal.error('No se pudo publicar', mensajeDeError(err));
      },
    });
  }

  ngOnDestroy(): void {
    this.quitarImagen();
  }
}
