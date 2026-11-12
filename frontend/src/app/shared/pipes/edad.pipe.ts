import { Pipe, PipeTransform } from '@angular/core';
import { calcularEdad } from '../../core/fechas';

/**
 * Edad en años a partir de la fecha de nacimiento.
 *   {{ u.fechaNacimiento | edad }}          → 25
 *   {{ u.fechaNacimiento | edad: 'texto' }} → "25 años"
 */
@Pipe({ name: 'edad' })
export class EdadPipe implements PipeTransform {
  transform(fechaNacimiento: string | null | undefined, formato: 'numero' | 'texto' = 'numero'): number | string | null {
    if (!fechaNacimiento) return null;
    const edad = calcularEdad(fechaNacimiento);
    return formato === 'texto' ? `${edad} ${edad === 1 ? 'año' : 'años'}` : edad;
  }
}
