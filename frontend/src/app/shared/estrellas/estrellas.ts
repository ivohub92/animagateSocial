import { Component, computed, input, model, signal } from '@angular/core';
import { Icono } from '../icono/icono';

const MAXIMO = 5;

/**
 * Fila de 5 estrellas. En modo edición permite elegir de 1 a 5 (al tocar la
 * estrella ya elegida se quita el puntaje, porque es opcional); en modo
 * solo lectura muestra el puntaje de una publicación.
 */
@Component({
  selector: 'app-estrellas',
  imports: [Icono],
  template: `
    @if (soloLectura()) {
      <span class="fila" role="img" [attr.aria-label]="valor() + ' de 5 estrellas'">
        @for (n of numeros; track n) {
          <app-icono nombre="estrella" [tam]="tam()" [class.llena]="n <= (valor() ?? 0)" />
        }
      </span>
    } @else {
      <span class="fila" role="radiogroup" aria-label="Puntaje de 1 a 5 estrellas" (mouseleave)="encima.set(null)">
        @for (n of numeros; track n) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="valor() === n"
            [attr.aria-label]="n + (n === 1 ? ' estrella' : ' estrellas')"
            [title]="valor() === n ? 'Quitar puntaje' : n + ' de 5'"
            (mouseenter)="encima.set(n)"
            (focus)="encima.set(n)"
            (blur)="encima.set(null)"
            (click)="elegir(n)"
          >
            <app-icono nombre="estrella" [tam]="tam()" [class.llena]="n <= mostrado()" />
          </button>
        }
      </span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
    }
    .fila {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    button {
      appearance: none;
      display: flex;
      padding: 2px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      transition: transform 0.15s;
    }
    button:hover {
      transform: scale(1.15);
    }
    app-icono {
      color: #475569;
      transition: color 0.15s;
    }
    app-icono.llena {
      color: #fbbf24;
      filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.5));
    }
    app-icono.llena ::ng-deep svg {
      fill: currentColor;
    }
  `,
})
export class Estrellas {

  readonly valor = model<number | null>(null);
  readonly soloLectura = input(false);
  readonly tam = input(16);

  protected readonly numeros = Array.from({ length: MAXIMO }, (_, i) => i + 1);
  protected readonly encima = signal<number | null>(null);

  protected readonly mostrado = computed(() => this.encima() ?? this.valor() ?? 0);

  protected elegir(n: number): void {
    this.valor.set(this.valor() === n ? null : n);

    this.encima.set(null);
  }
}
