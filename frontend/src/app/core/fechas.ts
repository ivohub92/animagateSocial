/** Edad en años cumplidos a partir de una fecha ISO (se interpreta en UTC, como la guarda el backend). */
export function calcularEdad(fechaIso: string): number {
  const nac = new Date(fechaIso);
  const hoy = new Date();
  let edad = hoy.getUTCFullYear() - nac.getUTCFullYear();
  const mes = hoy.getUTCMonth() - nac.getUTCMonth();
  if (mes < 0 || (mes === 0 && hoy.getUTCDate() < nac.getUTCDate())) edad--;
  return edad;
}
