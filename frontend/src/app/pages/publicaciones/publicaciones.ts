import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, mensajeDeError } from '../../core/auth.service';
import { calcularEdad } from '../../core/fechas';
import { OrdenPublicaciones, PaginaPublicaciones, Publicacion } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { Avatar } from '../../shared/avatar/avatar';
import { Icono } from '../../shared/icono/icono';
import { PublicacionCard } from '../../shared/publicacion/publicacion';
import { NuevaPublicacion } from './nueva-publicacion/nueva-publicacion';

/** Cantidad de publicaciones por página. */
const POR_PAGINA = 5;


const CONSEJOS_KIRA = [
  'Si tu reseña tiene spoilers, avisalo en el título. ¡La comunidad te lo agradece!',
  'Ordená por "Más me gusta" para ver los debates más calientes del momento.',
  'Una buena captura del episodio hace que tu publicación destaque en el feed.',
  'Los títulos cortos y claros reciben más me gusta. Palabra de bot.',
];

@Component({
  selector: 'app-publicaciones',
  imports: [RouterLink, DatePipe, Avatar, Icono, PublicacionCard, NuevaPublicacion],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.scss',
})
export class Publicaciones {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly servicio = inject(PublicacionesService);

  protected readonly orden = signal<OrdenPublicaciones>('fecha');
  protected readonly numeroPagina = signal(0);
  protected readonly pagina = signal<PaginaPublicaciones | null>(null);
  protected readonly cargando = signal(false);
  /** Las 3 publicaciones con más me gusta, para el ranking de la derecha. */
  protected readonly top = signal<Publicacion[]>([]);
  protected readonly consejo = CONSEJOS_KIRA[Math.floor(Math.random() * CONSEJOS_KIRA.length)];
  protected readonly error = signal<string | null>(null);

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil((this.pagina()?.total ?? 0) / POR_PAGINA)),
  );

  protected readonly edad = computed(() => {
    const u = this.auth.usuario();
    return u ? calcularEdad(u.fechaNacimiento) : null;
  });

  private pedido?: Subscription;
  private pedidoTop?: Subscription;

  constructor() {
    this.cargar();
  }


  protected cargar(): void {
    this.pedido?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);
    this.pedido = this.servicio
      .listar(this.orden(), this.numeroPagina() * POR_PAGINA, POR_PAGINA)
      .subscribe({
        next: (datos) => {
          // Si la página quedó vacía (por ejemplo, al eliminar la última), se vuelve a la anterior.
          if (datos.items.length === 0 && this.numeroPagina() > 0) {
            this.numeroPagina.update((n) => n - 1);
            this.cargar();
            return;
          }
          this.pagina.set(datos);
          this.cargando.set(false);
          this.cargarTop();
        },
        error: (err) => {
          this.cargando.set(false);
          this.error.set(mensajeDeError(err));
        },
      });
  }

  /** El ranking se actualiza junto con la lista (si falla, simplemente no se muestra). */
  private cargarTop(): void {
    this.pedidoTop?.unsubscribe();
    this.pedidoTop = this.servicio.listar('meGusta', 0, 3).subscribe({
      next: (datos) => this.top.set(datos.items.filter((p) => p.cantidadMeGusta > 0)),
      error: () => this.top.set([]),
    });
  }


  protected alCambiarMeGusta(): void {
    if (this.orden() === 'meGusta') {
      this.cargar();
    } else {
      this.cargarTop();
    }
  }

  protected cambiarOrden(orden: OrdenPublicaciones): void {
    if (orden === this.orden()) return;
    this.orden.set(orden);
    this.numeroPagina.set(0);
    this.cargar();
  }

  protected irAPagina(numero: number): void {
    this.numeroPagina.set(numero);
    this.cargar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  protected alPublicar(): void {
    this.orden.set('fecha');
    this.numeroPagina.set(0);
    this.cargar();
  }

  protected alEliminar(): void {
    this.cargar();
  }

  protected salir(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
