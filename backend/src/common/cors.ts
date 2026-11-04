import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';

/**
 * Deja un origen en su forma canónica para comparar: sin espacios, sin comillas
 * (a veces se pegan al cargar la variable en Render), sin "/" final y en minúsculas.
 */
const normalizar = (origen: string) =>
  origen.trim().replace(/^['"]+|['"]+$/g, '').replace(/\/+$/, '').toLowerCase();

/** Orígenes permitidos, leídos de CORS_ORIGIN (se pueden poner varios separados por coma). */
export function origenesPermitidos(): string[] {
  return (process.env.CORS_ORIGIN ?? 'http://localhost:4200')
    .split(',')
    .map(normalizar)
    .filter(Boolean);
}

export const opcionesCors: CorsOptions = {
  origin: (origen, callback) => {
    // Sin origen = Postman, curl o el propio servidor: CORS no aplica.
    if (!origen || origenesPermitidos().includes(normalizar(origen))) {
      return callback(null, true);
    }
    // Queda en los logs de Render para ver qué origen llegó y cuál se esperaba.
    console.warn(`CORS rechazado para ${origen}. Permitidos: ${origenesPermitidos().join(', ')}`);
    callback(null, false);
  },
};
