import { Directive, ElementRef, inject, input, signal } from '@angular/core';

/**
 * Directiva de atributo para <img>: si la imagen no carga (link roto, Cloudinary caído, sin conexión),
 * la reemplaza por una imagen de respaldo en lugar de mostrar el ícono roto del navegador.
 *   <img [src]="p.imagen" appImagenRespaldo />
 *   <img [src]="url" appImagenRespaldo="otra-imagen.svg" />
 */
@Directive({
  selector: 'img[appImagenRespaldo]',
  host: { '(error)': 'usarRespaldo()', '[class.imagen-respaldo]': 'fallo()' },
})
export class ImagenRespaldoDirective {
  readonly appImagenRespaldo = input<string>('');

  private readonly img = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;
  protected readonly fallo = signal(false);

  protected usarRespaldo(): void {
    if (this.fallo()) return; // si también falla el respaldo, no entra en un ciclo infinito
    this.fallo.set(true);
    this.img.src = this.appImagenRespaldo() || 'imagen-no-disponible.svg';
    this.img.alt = 'Imagen no disponible';
  }
}
