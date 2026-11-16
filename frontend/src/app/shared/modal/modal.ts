import { Component, ElementRef, HostListener, effect, inject, viewChild } from '@angular/core';
import { Icono, NombreIcono } from '../icono/icono';
import { ModalService, TipoModal } from './modal.service';

@Component({
  selector: 'app-modal',
  imports: [Icono],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  protected readonly modal = inject(ModalService);

  protected readonly etiquetas = { exito: 'Listo', error: 'Error', info: 'Aviso', confirmacion: 'Confirmar' };
  protected readonly iconos: Record<TipoModal, NombreIcono> = {
    exito: 'destellos',
    error: 'alerta',
    info: 'info',
    confirmacion: 'papelera',
  };

  private readonly boton = viewChild<ElementRef<HTMLButtonElement>>('boton');

  constructor() {
    effect(() => this.boton()?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.modal.actual()) this.modal.descartar();
  }
}
