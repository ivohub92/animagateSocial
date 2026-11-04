import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, mensajeDeError } from '../../../core/auth.service';
import { CargadorService } from '../../../shared/cargador/cargador.service';
import { Icono } from '../../../shared/icono/icono';
import { ModalService } from '../../../shared/modal/modal.service';


const DURACION_MINIMA_MS = 1400;


@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, Icono],
  templateUrl: './login-form.html',
})
export class LoginForm {
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);
  private readonly cargador = inject(CargadorService);


  readonly irARegistro = output<void>();

  protected readonly enviando = signal(false);
  protected readonly verPassword = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({

    identificador: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected invalido(campo: 'identificador' | 'password'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.cargador.mostrar('ENTRANDO A TU COSMO...');
    const inicio = Date.now();

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (usuario) => {
        // Con el login hecho, KIRA-BOT saluda y después se entra al feed.
        this.cargador.mostrar('ENTRANDO A TU COSMO...', `¡Hola, ${usuario.nombre}!`);
        const falta = Math.max(0, DURACION_MINIMA_MS - (Date.now() - inicio));
        setTimeout(async () => {
          await this.router.navigateByUrl('/publicaciones');
          this.cargador.ocultar();
          this.enviando.set(false);
        }, falta);
      },
      error: (err) => {
        this.cargador.ocultar();
        this.enviando.set(false);
        this.modal.error('No se pudo iniciar sesión', mensajeDeError(err));
      },
    });
  }
}
