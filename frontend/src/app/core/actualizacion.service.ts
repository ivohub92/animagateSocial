import { inject, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ModalService } from '../shared/modal/modal.service';

/**
 * PWA: cuando subimos una versión nueva a Vercel, el service worker la descarga en segundo plano.
 * Al tenerla lista, avisamos y, si el usuario acepta, recargamos para usarla.
 */
@Injectable({ providedIn: 'root' })
export class ActualizacionService {
  private readonly sw = inject(SwUpdate);
  private readonly modal = inject(ModalService);

  iniciar(): void {
    if (!this.sw.isEnabled) return; // en desarrollo no hay service worker
    this.sw.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(async () => {
        const recargar = await this.modal.confirmar(
          'Hay una versión nueva de AnimeGate',
          'Recargá para usar la última versión de la app.',
          'Recargar',
          'info',
          'Más tarde',
        );
        if (recargar) document.location.reload();
      });
  }
}
