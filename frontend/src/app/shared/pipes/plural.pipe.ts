import { Pipe, PipeTransform } from '@angular/core';

const numero = new Intl.NumberFormat('es-AR');
const SIN_TILDE: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };

/** Plural regular del español: "comentario" → "comentarios", "publicación" → "publicaciones". */
function pluralizar(palabra: string): string {
  if (/[aeiouáéó]$/i.test(palabra)) return palabra + 's';
  // Termina en consonante: se agrega "es" y se va la tilde de la última sílaba (canción → canciones)
  return palabra.replace(/([áéíóú])([ns])$/i, (_, v: string, c: string) => (SIN_TILDE[v] ?? v) + c) + 'es';
}

/**
 * Cantidad + palabra en singular o plural, con el número formateado en es-AR.
 *   {{ 1 | plural: 'comentario' }}          → "1 comentario"
 *   {{ 1500 | plural: 'publicación' }}      → "1.500 publicaciones"
 *   {{ 2 | plural: 'me gusta' : 'me gusta' }} → "2 me gusta" (plural irregular a mano)
 */
@Pipe({ name: 'plural' })
export class PluralPipe implements PipeTransform {
  transform(cantidad: number | null | undefined, singular: string, plural?: string): string {
    const n = cantidad ?? 0;
    return `${numero.format(n)} ${n === 1 ? singular : (plural ?? pluralizar(singular))}`;
  }
}
