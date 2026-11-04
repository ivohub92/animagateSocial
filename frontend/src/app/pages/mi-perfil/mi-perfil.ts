import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, mensajeDeError } from '../../core/auth.service';
import { calcularEdad } from '../../core/fechas';
import { PaginaPublicaciones } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { Avatar } from '../../shared/avatar/avatar';
import { Icono } from '../../shared/icono/icono';
import { PublicacionCard } from '../../shared/publicacion/publicacion';


const ULTIMAS = 3;

@Component({
  selector: 'app-mi-perfil',
  imports: [RouterLink, DatePipe, Avatar, Icono, PublicacionCard],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.scss',
})
export class MiPerfil {
  protected readonly auth = inject(AuthService);
  private readonly servicio = inject(PublicacionesService);

  protected readonly pestana = signal<'publicaciones' | 'datos'>('publicaciones');
  protected readonly mias = signal<PaginaPublicaciones | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly ultimas = ULTIMAS;

  protected readonly edad = computed(() => {
    const u = this.auth.usuario();
    return u ? calcularEdad(u.fechaNacimiento) : null;
  });

 
  protected readonly meGustaRecibidos = computed(
    () => this.mias()?.items.reduce((total, p) => total + p.cantidadMeGusta, 0) ?? 0,
  );

  private pedido?: Subscription;

  constructor() {
    // Cuando hay sesión, trae las últimas publicaciones de quien está logueado.
    effect(() => {
      const u = this.auth.usuario();
      if (u) this.cargar(u._id);
    });
  }

  protected cargar(usuario = this.auth.usuario()?._id): void {
    if (!usuario) return;
    this.pedido?.unsubscribe();
    this.error.set(null);
    this.pedido = this.servicio.listar('fecha', 0, ULTIMAS, usuario).subscribe({
      next: (datos) => this.mias.set(datos),
      error: (err) => this.error.set(mensajeDeError(err)),
    });
  }
}
