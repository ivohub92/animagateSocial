import { IsISO8601, IsOptional, IsString } from 'class-validator';

/**
 * Lapso de tiempo de las estadísticas (query string). desde incluido, hasta excluido.
 * Si no se mandan: los últimos 30 días. zona es la zona horaria del navegador, para agrupar
 * los comentarios por día como los ve el usuario (por defecto, la de Argentina).
 */
export class RangoFechasDto {
  @IsOptional()
  @IsISO8601({}, { message: 'desde debe ser una fecha (ISO 8601)' })
  desde?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'hasta debe ser una fecha (ISO 8601)' })
  hasta?: string;

  @IsOptional()
  @IsString()
  zona?: string;
}
