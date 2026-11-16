import { Pipe, PipeTransform } from '@angular/core';

const numero = new Intl.NumberFormat('es-AR');
const SIN_TILDE: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };

/** Plural regular del español: "comentario" → "comentarios", "publicación" → "publicaciones". */
function pluralizar(palabra: string): string {
  if (/[aeiouáéó]$/i.test(palabra)) return palabra + 's';
  // Termina en consonante: se agrega "es" y se va la tilde de la última sílaba (canción → canciones)
  return palabra.replace(/([áéíóú])([ns])$/i, (_, v: string, c: string) => (SIN_TILDE[v] ?? v) + c) + 'es';
}

@Pipe({ name: 'plural' })
export class PluralPipe implements PipeTransform {
  transform(cantidad: number | null | undefined, singular: string, plural?: string): string {
    const n = cantidad ?? 0;
    return `${numero.format(n)} ${n === 1 ? singular : (plural ?? pluralizar(singular))}`;
  }
}
