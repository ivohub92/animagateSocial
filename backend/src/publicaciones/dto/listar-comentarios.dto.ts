import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Parámetros de GET /publicaciones/:id/comentarios (llegan como query string). */
export class ListarComentariosDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset debe ser un número entero' })
  @Min(0, { message: 'offset no puede ser negativo' })
  offset = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser al menos 1' })
  @Max(50, { message: 'limit no puede superar 50' })
  limit = 20;
}
