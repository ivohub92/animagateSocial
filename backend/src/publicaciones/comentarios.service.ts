import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { CrearComentarioDto } from './dto/crear-comentario.dto.js';
import { EditarComentarioDto } from './dto/editar-comentario.dto.js';
import { ListarComentariosDto } from './dto/listar-comentarios.dto.js';
import { Comentario } from './schemas/comentario.schema.js';
import { Publicacion } from './schemas/publicacion.schema.js';

/** Datos del autor que viajan con cada comentario (nunca la contraseña). */
const CAMPOS_AUTOR = 'nombre apellido nombreUsuario imagenPerfil';

/**
 * Solo comentarios activos. Se usa $ne: false (y no activa: true) para que también entren
 * los comentarios creados antes de que existiera el campo.
 */
const ACTIVO = { activa: { $ne: false } };

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Comentario.name) private readonly comentarioModel: Model<Comentario>,
    @InjectModel(Publicacion.name) private readonly publicacionModel: Model<Publicacion>,
  ) {}

  /** Comentarios de una publicación, los más recientes primero, paginados. */
  async listar(idPublicacion: string, filtros: ListarComentariosDto) {
    await this.verificarPublicacion(idPublicacion);
    const condicion = { publicacion: new Types.ObjectId(idPublicacion), ...ACTIVO };

    const [items, total] = await Promise.all([
      this.comentarioModel
        .find(condicion)
        .sort({ createdAt: -1 })
        .skip(filtros.offset)
        .limit(filtros.limit)
        .populate('usuario', CAMPOS_AUTOR)
        .lean()
        .exec(),
      this.comentarioModel.countDocuments(condicion).exec(),
    ]);
    return { items: items.map(sinVersion), total, offset: filtros.offset, limit: filtros.limit };
  }

  /** Agrega un comentario con el usuario que lo hizo; la fecha la pone timestamps. */
  async crear(idPublicacion: string, dto: CrearComentarioDto, autor: UserDocument) {
    await this.verificarPublicacion(idPublicacion);
    const creado = await this.comentarioModel.create({
      publicacion: new Types.ObjectId(idPublicacion),
      usuario: autor._id,
      mensaje: dto.mensaje,
    });
    // Contador en la publicación, para mostrar "N comentarios" sin contarlos cada vez.
    await this.publicacionModel
      .updateOne({ _id: idPublicacion }, { $inc: { cantidadComentarios: 1 } })
      .exec();

    const comentario = await this.comentarioModel
      .findById(creado._id)
      .populate('usuario', CAMPOS_AUTOR)
      .lean()
      .exec();
    return sinVersion(comentario!);
  }

  /** PUT: cambia el mensaje y marca modificado: true. Solo quien escribió el comentario. */
  async editar(
    idPublicacion: string,
    idComentario: string,
    dto: EditarComentarioDto,
    usuario: UserDocument,
  ) {
    await this.verificarPublicacion(idPublicacion);
    const comentario = await this.comentarioModel
      .findOne({ _id: idComentario, publicacion: new Types.ObjectId(idPublicacion), ...ACTIVO })
      .exec();
    if (!comentario) throw new NotFoundException('El comentario no existe');
    if (String(comentario.usuario) !== String(usuario._id)) {
      throw new ForbiddenException('Solo quien escribió el comentario puede editarlo');
    }

    comentario.mensaje = dto.mensaje;
    comentario.modificado = true;
    await comentario.save();

    const editado = await this.comentarioModel
      .findById(comentario._id)
      .populate('usuario', CAMPOS_AUTOR)
      .lean()
      .exec();
    return sinVersion(editado!);
  }

  /** Solo se comenta (o se leen comentarios) en publicaciones que existen y no fueron dadas de baja. */
  private async verificarPublicacion(id: string) {
    const existe = await this.publicacionModel.exists({ _id: id, activa: true }).exec();
    if (!existe) throw new NotFoundException('La publicación no existe');
  }
}

/** Saca de la respuesta los campos internos (__v y la marca de baja lógica). */
function sinVersion<T extends object>(doc: T) {
  const { __v: _v, activa: _activa, ...resto } = doc as T & { __v?: number; activa?: boolean };
  return resto;
}
