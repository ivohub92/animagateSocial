import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/admin.guard.js';
import { UsuarioActualGuard } from '../common/usuario-actual.js';
import { RangoFechasDto } from './dto/rango-fechas.dto.js';
import { EstadisticasService } from './estadisticas.service.js';

/**
 * Estadísticas del dashboard (Sprint 4). Todas por GET, con el lapso en la query:
 *   ?desde=<ISO>&hasta=<ISO>&zona=<zona horaria>   (por defecto, los últimos 30 días)
 * Solo administradores: 401 sin token, 403 si no es admin, 400 si el lapso no es válido.
 */
@Controller('estadisticas')
@UseGuards(UsuarioActualGuard, AdminGuard)
export class EstadisticasController {
  constructor(private readonly estadisticas: EstadisticasService) {}

  /** GET /estadisticas/publicaciones-por-usuario → { total, items: [{ usuario, cantidad }] } */
  @Get('publicaciones-por-usuario')
  publicacionesPorUsuario(@Query() rango: RangoFechasDto) {
    return this.estadisticas.publicacionesPorUsuario(rango);
  }

  /** GET /estadisticas/comentarios-por-dia → { total, dias: [{ fecha: 'YYYY-MM-DD', cantidad }] } */
  @Get('comentarios-por-dia')
  comentariosPorDia(@Query() rango: RangoFechasDto) {
    return this.estadisticas.comentariosPorDia(rango);
  }

  /** GET /estadisticas/comentarios-por-publicacion → { total, items: [{ publicacion, cantidad }] } */
  @Get('comentarios-por-publicacion')
  comentariosPorPublicacion(@Query() rango: RangoFechasDto) {
    return this.estadisticas.comentariosPorPublicacion(rango);
  }
}
