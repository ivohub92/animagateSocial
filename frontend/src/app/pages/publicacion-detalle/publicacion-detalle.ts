import { Component, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/auth.service';
import { Publicacion } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { Icono } from '../../shared/icono/icono';
import { PublicacionCard } from '../../shared/publicacion/publicacion';

/** Página de una publicación: se ve en grande, con todos sus comentarios. */
@Component({
  selector: 'app-publicacion-detalle',
  imports: [RouterLink, Icono, PublicacionCard],
  templateUrl: './publicacion-detalle.html',
  styleUrl: './publicacion-detalle.scss',
})
export class PublicacionDetalle {
  private readonly servicio = inject(PublicacionesService);
  private readonly router = inject(Router);

  /** :id de la ruta (llega por withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly publicacion = signal<Publicacion | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Si cambia el :id (por ejemplo, desde otro enlace), se vuelve a pedir.
    effect(() => this.cargar(this.id()));
  }

  protected cargar(id = this.id()): void {
    this.publicacion.set(null);
    this.error.set(null);
    this.servicio.obtener(id).subscribe({
      next: (p) => this.publicacion.set(p),
      error: (err) => this.error.set(mensajeDeError(err)),
    });
  }

  /** Si se elimina desde acá, se vuelve al feed. */
  protected alEliminar(): void {
    this.router.navigateByUrl('/publicaciones');
  }
}
