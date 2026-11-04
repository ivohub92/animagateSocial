import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';


export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d).{8,}$/;


export function coincidenValidator(campo: string, confirmacion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const a = grupo.get(campo)?.value;
    const b = grupo.get(confirmacion)?.value;
    return a && b && a !== b ? { noCoinciden: true } : null;
  };
}

function parsearFecha(valor: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!partes) return null;
  const fecha = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
  return isNaN(fecha.getTime()) ? null : fecha;
}


export function fechaNoFuturaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const fecha = parsearFecha(control.value);
  if (!fecha) return { fechaInvalida: true };
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fecha > hoy ? { fechaFutura: true } : null;
}


export function edadMinimaValidator(minimo: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const fecha = parsearFecha(control.value);
    if (!fecha) return { fechaInvalida: true };
    const limite = new Date();
    limite.setFullYear(limite.getFullYear() - minimo);
    return fecha > limite ? { edadMinima: { minimo } } : null;
  };
}
