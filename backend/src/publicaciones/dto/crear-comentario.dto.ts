import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CrearComentarioDto {
  // Se recortan los espacios antes de validar: "   " cuenta como vacío.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'El comentario no puede estar vacío' })
  @MaxLength(500, { message: 'El comentario no puede superar los 500 caracteres' })
  mensaje: string;
}
