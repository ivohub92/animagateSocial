import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgControl } from '@angular/forms';

/**
 * Directiva de atributo para <textarea>: crece mientras se escribe (y vuelve a achicarse),
 * hasta un máximo en píxeles; pasado ese alto aparece el scroll.
 *   <textarea appAutoAltura [alturaMaxima]="160"></textarea>
 * Si el textarea tiene un control de formulario, también se ajusta cuando el valor cambia
 * desde el código (por ejemplo, al vaciarlo después de enviar).
 */
@Directive({
  selector: 'textarea[appAutoAltura]',
  host: { '(input)': 'ajustar()', '[style.overflow-y]': 'scroll()' },
})
export class AutoAlturaDirective {
  readonly alturaMaxima = input(240);

  private readonly textarea = inject<ElementRef<HTMLTextAreaElement>>(ElementRef).nativeElement;
  protected readonly scroll = signal<'hidden' | 'auto'>('hidden');

  constructor() {
    const control = inject(NgControl, { optional: true, self: true });
    control?.valueChanges
      ?.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => requestAnimationFrame(() => this.ajustar()));
    afterNextRender(() => this.ajustar());
  }

  protected ajustar(): void {
    const t = this.textarea;
    t.style.height = 'auto'; // primero se achica, para medir el alto real del texto
    const borde = t.offsetHeight - t.clientHeight;
    const alto = Math.min(t.scrollHeight + borde, this.alturaMaxima());
    t.style.height = `${alto}px`;
    this.scroll.set(t.scrollHeight + borde > this.alturaMaxima() ? 'auto' : 'hidden');
  }
}
