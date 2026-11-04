import { Component, computed, input, linkedSignal } from '@angular/core';
import { Usuario } from '../../core/models';

type DatosAvatar = Pick<Usuario, 'nombre' | 'apellido' | 'imagenPerfil'>;


@Component({
  selector: 'app-avatar',
  template: `
    @if (usuario()?.imagenPerfil; as src) {
      @if (!fallo()) {
        <img [src]="src" [alt]="'Foto de ' + usuario()!.nombre" (error)="fallo.set(true)" />
      } @else {
        {{ iniciales() }}
      }
    } @else {
      {{ iniciales() }}
    }
  `,
  styles: `
    :host {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      aspect-ratio: 1 / 1;
      border-radius: min(30%, 16px);
      font-family: var(--font-heading);
      font-weight: 700;
      letter-spacing: 0.02em;
      color: var(--anime-cyan);
      background: linear-gradient(135deg, #1b1f35, #222744);
      border: 2px solid #334155;
    }
    :host(.propio) {
      color: #fff;
      background: linear-gradient(135deg, var(--anime-pink), var(--anime-purple));
      border-color: var(--anime-pink);
      box-shadow: 0 0 12px rgba(255, 42, 133, 0.45);
    }
    :host(.en-barra) {
      color: #fff;
      background: linear-gradient(135deg, var(--anime-cyan), var(--anime-blue));
      border-color: var(--anime-cyan);
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.45);
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
  host: {
    '[class]': 'variante()',
    '[style.width]': 'size() ? size() + "px" : "100%"',
    '[style.height]': 'size() ? size() + "px" : null',
    '[style.font-size.px]': 'size() ? size()! * 0.36 : 64',
  },
})
export class Avatar {
  readonly usuario = input<DatosAvatar | null>(null);
  /** Lado en px; sin valor ocupa todo el ancho disponible. */
  readonly size = input<number | null>(null);
  readonly variante = input<'otro' | 'propio' | 'en-barra'>('otro');

  /** Si la foto no carga (link roto o caído) se muestran las iniciales; se reinicia al cambiar la foto. */
  protected readonly fallo = linkedSignal({
    source: () => this.usuario()?.imagenPerfil,
    computation: () => false,
  });

  protected readonly iniciales = computed(() => {
    const u = this.usuario();
    return u ? `${u.nombre[0] ?? ''}${u.apellido[0] ?? ''}`.toUpperCase() : '?';
  });
}
