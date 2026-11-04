import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const ANIOS_HACIA_ATRAS = 120;

const dosDigitos = (n: number) => String(n).padStart(2, '0');

/**
 * Selector de fecha con tres desplegables (día / mes / año) que se usa como un
 * FormControl más (formControlName). Evita recorrer años en el calendario nativo
 * y no ofrece fechas futuras. Su valor es 'yyyy-mm-dd', o '' si está incompleta.
 */
@Component({
  selector: 'app-fecha-select',
  templateUrl: './fecha-select.html',
  styleUrl: './fecha-select.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FechaSelect), multi: true },
  ],
})
export class FechaSelect implements ControlValueAccessor {
  /** id del primer desplegable, para que el <label for> del formulario lo enfoque. */
  readonly inputId = input<string>('');
  readonly invalido = input(false);

  protected readonly dia = signal<number | null>(null);
  protected readonly mes = signal<number | null>(null);
  protected readonly anio = signal<number | null>(null);
  protected readonly deshabilitado = signal(false);

  private readonly hoy = new Date();

  protected readonly anios = Array.from(
    { length: ANIOS_HACIA_ATRAS + 1 },
    (_, i) => this.hoy.getFullYear() - i,
  );

  /** En el año actual solo se ofrecen los meses que ya llegaron. */
  protected readonly meses = computed(() => {
    const tope = this.anio() === this.hoy.getFullYear() ? this.hoy.getMonth() + 1 : 12;
    return MESES.slice(0, tope).map((nombre, i) => ({ numero: i + 1, nombre }));
  });

  /** Días según el mes (28 a 31) y, en el mes actual, solo hasta hoy. */
  protected readonly dias = computed(() => {
    const anio = this.anio() ?? 2000; // año bisiesto: permite el 29 de febrero
    const mes = this.mes();
    let tope = mes ? new Date(anio, mes, 0).getDate() : 31;
    if (anio === this.hoy.getFullYear() && mes === this.hoy.getMonth() + 1) {
      tope = Math.min(tope, this.hoy.getDate());
    }
    return Array.from({ length: tope }, (_, i) => i + 1);
  });

  private onChange: (valor: string) => void = () => {};
  protected onTouched: () => void = () => {};

  protected cambiar(parte: 'dia' | 'mes' | 'anio', event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this[parte].set(valor ? Number(valor) : null);

    // Si al cambiar mes o año el día/mes elegido ya no existe, se descarta.
    const mes = this.mes();
    if (mes && !this.meses().some((m) => m.numero === mes)) this.mes.set(null);
    const dia = this.dia();
    if (dia && !this.dias().includes(dia)) this.dia.set(null);

    this.onChange(this.valorActual());
  }

  private valorActual(): string {
    const [d, m, a] = [this.dia(), this.mes(), this.anio()];
    return d && m && a ? `${a}-${dosDigitos(m)}-${dosDigitos(d)}` : '';
  }

  writeValue(valor: string | null): void {
    const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor ?? '');
    this.anio.set(partes ? Number(partes[1]) : null);
    this.mes.set(partes ? Number(partes[2]) : null);
    this.dia.set(partes ? Number(partes[3]) : null);
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
  }
}
