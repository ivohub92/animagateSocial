import { Pipe, PipeTransform } from '@angular/core';

type ConNombre = { nombre: string; apellido: string } | null | undefined;

/**
 * Arma el nombre para mostrar de un usuario.
 *   {{ u | nombreCompleto }}           → "Ana Gómez"
 *   {{ u | nombreCompleto: 'corto' }}  → "Ana G."
 */
@Pipe({ name: 'nombreCompleto' })
export class NombreCompletoPipe implements PipeTransform {
  transform(usuario: ConNombre, formato: 'completo' | 'corto' = 'completo'): string {
    if (!usuario) return '';
    const nombre = usuario.nombre.trim();
    const apellido = usuario.apellido.trim();
    if (!apellido) return nombre;
    return formato === 'corto' ? `${nombre} ${apellido[0].toUpperCase()}.` : `${nombre} ${apellido}`;
  }
}
