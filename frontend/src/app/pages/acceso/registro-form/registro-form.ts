import { Component, OnDestroy, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, mensajeDeError } from '../../../core/auth.service';
import { Perfil, Usuario } from '../../../core/models';
import { UsuariosService } from '../../../core/usuarios.service';
import {
  PASSWORD_PATTERN,
  coincidenValidator,
  edadMinimaValidator,
  fechaNoFuturaValidator,
} from '../../../core/validators';
import { FechaSelect } from '../../../shared/fecha-select/fecha-select';
import { Icono } from '../../../shared/icono/icono';
import { ModalService } from '../../../shared/modal/modal.service';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGEN_MB = 5;
const NIVELES = ['', 'Débil', 'Regular', 'Segura', 'Muy segura'];

const CAMPOS_API = [
  'nombre',
  'apellido',
  'correo',
  'nombreUsuario',
  'password',
  'repetirPassword',
  'fechaNacimiento',
  'descripcion',
] as const;


@Component({
  selector: 'app-registro-form',
  imports: [ReactiveFormsModule, FechaSelect, Icono],
  templateUrl: './registro-form.html',
  styleUrl: './registro-form.scss',
})
export class RegistroForm implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly usuarios = inject(UsuariosService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);

  /**
   * registro: la pestaña "Registrarse" (crea la cuenta e inicia sesión).
   * admin: el formulario del dashboard (Sprint 4): elige el perfil con dos radio buttons, crea
   * el usuario con POST /usuarios y no toca la sesión del administrador.
   */
  readonly modo = input<'registro' | 'admin'>('registro');
  /** Solo en modo admin: el usuario recién creado, para sumarlo al listado. */
  readonly creado = output<Usuario>();


  readonly previewCambio = output<string | null>();

  protected readonly enviando = signal(false);
  protected readonly verPassword = signal(false);
  protected readonly imagen = signal<File | null>(null);
  protected readonly preview = signal<string | null>(null);
  protected readonly errorImagen = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      apellido: ['', [Validators.required, Validators.maxLength(50)]],
      nombreUsuario: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(/^[a-zA-Z0-9._]+$/),
        ],
      ],
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      repetirPassword: ['', Validators.required],
      fechaNacimiento: [
        '',
        [Validators.required, fechaNoFuturaValidator, edadMinimaValidator(13)],
      ],
      descripcion: ['', Validators.maxLength(200)],
      terminos: [false, Validators.requiredTrue],
      perfil: ['usuario' as Perfil],
    },
    { validators: coincidenValidator('password', 'repetirPassword') },
  );

  private readonly password = toSignal(this.form.controls.password.valueChanges, {
    initialValue: '',
  });
  protected readonly usuario = toSignal(this.form.controls.nombreUsuario.valueChanges, {
    initialValue: '',
  });
  protected readonly descripcion = toSignal(this.form.controls.descripcion.valueChanges, {
    initialValue: '',
  });

  /** Medidor de 4 niveles: largo, mayúscula, número y (símbolo o 12+ caracteres). */
  protected readonly fuerza = computed(() => {
    const p = this.password();
    if (!p) return 0;
    return [p.length >= 8, /[A-Z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p) || p.length >= 12]
      .filter(Boolean).length;
  });
  protected readonly etiquetaFuerza = computed(() => NIVELES[this.fuerza()]);
  protected readonly barras = [1, 2, 3, 4];

  ngOnInit(): void {
    // Las normas las acepta cada persona al registrarse: en el alta del admin no se piden
    // (un control deshabilitado no cuenta para la validez del formulario).
    if (this.modo() === 'admin') this.form.controls.terminos.disable();
  }

  protected invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  protected get noCoinciden(): boolean {
    const c = this.form.controls.repetirPassword;
    return this.form.hasError('noCoinciden') && (c.touched || c.dirty);
  }

  protected seleccionarImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.errorImagen.set(null);

    if (archivo && !TIPOS_IMAGEN.includes(archivo.type)) {
      this.errorImagen.set('La imagen debe ser JPG, PNG, WEBP o GIF.');
      input.value = '';
      return;
    }
    if (archivo && archivo.size > MAX_IMAGEN_MB * 1024 * 1024) {
      this.errorImagen.set(`La imagen no puede superar los ${MAX_IMAGEN_MB} MB.`);
      input.value = '';
      return;
    }

    this.liberarPreview();
    this.imagen.set(archivo);
    this.preview.set(archivo ? URL.createObjectURL(archivo) : null);
    this.previewCambio.emit(this.preview());
  }

  protected quitarImagen(input: HTMLInputElement): void {
    input.value = '';
    this.liberarPreview();
    this.imagen.set(null);
    this.preview.set(null);
    this.previewCambio.emit(null);
  }

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.modal.error('Revisá el formulario', 'Hay campos incompletos o con errores.');
      return;
    }

    const valores = this.form.getRawValue();
    const datos = new FormData();
    for (const campo of CAMPOS_API) datos.append(campo, valores[campo]);
    const imagen = this.imagen();
    if (imagen) datos.append('imagenPerfil', imagen);

    this.enviando.set(true);
    if (this.modo() === 'admin') {
      this.crearComoAdmin(datos, valores.perfil);
      return;
    }
    this.auth.registro(datos).subscribe({
      next: (usuario) => {
        this.enviando.set(false);
        this.modal.exito(
          'Cuenta creada',
          `Bienvenido/a a AnimeGate, ${usuario.nombre}. Ya podés entrar a tu cronología.`,
          () => this.router.navigateByUrl('/publicaciones'),
        );
      },
      error: (err) => {
        this.enviando.set(false);
        this.modal.error('No se pudo crear la cuenta', mensajeDeError(err));
      },
    });
  }

  /** Alta desde el dashboard: POST /usuarios con el perfil elegido; el form queda listo para otro. */
  private crearComoAdmin(datos: FormData, perfil: Perfil): void {
    datos.append('perfil', perfil);
    this.usuarios.crear(datos).subscribe({
      next: (usuario) => {
        this.enviando.set(false);
        this.modal.exito(
          'Usuario creado',
          `@${usuario.nombreUsuario} ya puede ingresar como ${usuario.perfil === 'administrador' ? 'administrador' : 'usuario'}.`,
        );
        this.form.reset();
        this.liberarPreview();
        this.imagen.set(null);
        this.preview.set(null);
        this.creado.emit(usuario);
      },
      error: (err) => {
        this.enviando.set(false);
        this.modal.error('No se pudo crear el usuario', mensajeDeError(err));
      },
    });
  }

  ngOnDestroy(): void {
    this.liberarPreview();
  }

  private liberarPreview(): void {
    const url = this.preview();
    if (url) URL.revokeObjectURL(url);
  }
}
