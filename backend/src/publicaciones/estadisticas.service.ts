import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RangoFechasDto } from './dto/rango-fechas.dto.js';
import { Comentario } from './schemas/comentario.schema.js';
import { Publicacion } from './schemas/publicacion.schema.js';

const DIA_MS = 24 * 60 * 60 * 1000;
const MAX_DIAS = 366;
const ZONA_POR_DEFECTO = 'America/Argentina/Buenos_Aires';
const CAMPOS_AUTOR = 'nombre apellido nombreUsuario';

interface Rango {
  desde: Date;
  hasta: Date;
  zona: string;
}

type Autor = { _id: Types.ObjectId; nombre: string; apellido: string; nombreUsuario: string };

/** Estadísticas para el dashboard (Sprint 4). Solo cuentan publicaciones y comentarios activos. */
@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(Publicacion.name) private readonly publicacionModel: Model<Publicacion>,
    @InjectModel(Comentario.name) private readonly comentarioModel: Model<Comentario>,
  ) {}

  /** Cantidad de publicaciones de cada usuario en el lapso, de mayor a menor. */
  async publicacionesPorUsuario(filtros: RangoFechasDto) {
    const rango = this.rango(filtros);
    const publicaciones = await this.publicacionModel
      .find({ activa: true, createdAt: { $gte: rango.desde, $lt: rango.hasta } })
      .select('usuario')
      .populate('usuario', CAMPOS_AUTOR)
      .lean<{ usuario: Autor | null }[]>()
      .exec();

    const porUsuario = new Map<string, { usuario: Autor; cantidad: number }>();
    for (const { usuario } of publicaciones) {
      if (!usuario) continue; // autor borrado de la base: no se puede mostrar
      const fila = porUsuario.get(String(usuario._id)) ?? { usuario, cantidad: 0 };
      fila.cantidad++;
      porUsuario.set(String(usuario._id), fila);
    }
    const items = [...porUsuario.values()].sort(
      (a, b) => b.cantidad - a.cantidad || a.usuario.nombreUsuario.localeCompare(b.usuario.nombreUsuario),
    );
    return { ...this.respuestaRango(rango), total: publicaciones.length, items };
  }

  /** Cantidad de comentarios en el lapso: el total y cuántos hubo cada día (días sin comentarios en 0). */
  async comentariosPorDia(filtros: RangoFechasDto) {
    const rango = this.rango(filtros);
    const comentarios = await this.comentarioModel
      .find({ activa: { $ne: false }, createdAt: { $gte: rango.desde, $lt: rango.hasta } })
      .select('createdAt')
      .lean<{ createdAt: Date }[]>()
      .exec();

    const porDia = new Map(this.diasDelRango(rango).map((dia) => [dia, 0]));
    for (const { createdAt } of comentarios) {
      const dia = this.diaLocal(new Date(createdAt), rango.zona);
      porDia.set(dia, (porDia.get(dia) ?? 0) + 1);
    }
    const dias = [...porDia].map(([fecha, cantidad]) => ({ fecha, cantidad }));
    return { ...this.respuestaRango(rango), total: comentarios.length, dias };
  }

  /** Cantidad de comentarios que recibió cada publicación en el lapso, de mayor a menor. */
  async comentariosPorPublicacion(filtros: RangoFechasDto) {
    const rango = this.rango(filtros);
    const comentarios = await this.comentarioModel
      .find({ activa: { $ne: false }, createdAt: { $gte: rango.desde, $lt: rango.hasta } })
      .select('publicacion')
      .lean<{ publicacion: Types.ObjectId }[]>()
      .exec();

    const cantidades = new Map<string, number>();
    for (const { publicacion } of comentarios) {
      cantidades.set(String(publicacion), (cantidades.get(String(publicacion)) ?? 0) + 1);
    }

    // Datos de las publicaciones (solo las activas: las dadas de baja no se muestran).
    const publicaciones = await this.publicacionModel
      .find({ _id: { $in: [...cantidades.keys()] }, activa: true })
      .select('titulo usuario')
      .populate('usuario', CAMPOS_AUTOR)
      .lean<{ _id: Types.ObjectId; titulo: string; usuario: Autor | null }[]>()
      .exec();

    const items = publicaciones
      .map((p) => ({
        publicacion: { _id: p._id, titulo: p.titulo, autor: p.usuario?.nombreUsuario ?? null },
        cantidad: cantidades.get(String(p._id)) ?? 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad || a.publicacion.titulo.localeCompare(b.publicacion.titulo));
    const total = items.reduce((suma, i) => suma + i.cantidad, 0);
    return { ...this.respuestaRango(rango), total, items };
  }

  /** Valida el lapso: fechas reales, desde antes que hasta, máximo un año; por defecto, 30 días. */
  private rango({ desde, hasta, zona }: RangoFechasDto): Rango {
    const fin = hasta ? new Date(hasta) : new Date();
    const inicio = desde ? new Date(desde) : new Date(fin.getTime() - 30 * DIA_MS);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      throw new BadRequestException('Las fechas del lapso no son válidas');
    }
    if (inicio >= fin) throw new BadRequestException('La fecha "desde" tiene que ser anterior a "hasta"');
    if (fin.getTime() - inicio.getTime() > MAX_DIAS * DIA_MS) {
      throw new BadRequestException(`El lapso no puede superar los ${MAX_DIAS} días`);
    }
    const zonaFinal = zona ?? ZONA_POR_DEFECTO;
    try {
      new Intl.DateTimeFormat('es-AR', { timeZone: zonaFinal });
    } catch {
      throw new BadRequestException('La zona horaria no es válida');
    }
    return { desde: inicio, hasta: fin, zona: zonaFinal };
  }

  private respuestaRango({ desde, hasta, zona }: Rango) {
    return { desde: desde.toISOString(), hasta: hasta.toISOString(), zona };
  }

  /** "YYYY-MM-DD" del día en la zona horaria pedida (en-CA da justo ese formato). */
  private diaLocal(fecha: Date, zona: string): string {
    return fecha.toLocaleDateString('en-CA', { timeZone: zona });
  }

  /** Todos los días del lapso, en orden, para que la línea muestre también los días en 0. */
  private diasDelRango({ desde, hasta, zona }: Rango): string[] {
    const dias = new Set<string>();
    for (let t = desde.getTime(); t < hasta.getTime(); t += DIA_MS / 2) {
      dias.add(this.diaLocal(new Date(t), zona));
    }
    dias.add(this.diaLocal(new Date(hasta.getTime() - 1), zona));
    return [...dias].sort();
  }
}
