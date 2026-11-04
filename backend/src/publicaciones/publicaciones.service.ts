import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { saveImage } from '../common/image-upload.js';
import { Perfil, UserDocument } from '../users/schemas/user.schema.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { Publicacion } from './schemas/publicacion.schema.js';

/** Datos del autor que se muestran junto a cada publicación. */
const CAMPOS_AUTOR = 'nombre apellido nombreUsuario imagenPerfil';

type PublicacionLean = Publicacion & { _id: Types.ObjectId; usuario: unknown };

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<Publicacion>,
  ) {}

  async crear(dto: CrearPublicacionDto, autor: UserDocument, imagen?: Express.Multer.File) {
    const creada = await this.publicacionModel.create({
      ...dto,
      usuario: autor._id,
      imagen: imagen ? await saveImage(imagen, 'publicaciones') : null,
    });
    return this.buscarParaRespuesta(creada._id, String(autor._id));
  }

  /**
   * Listado paginado de publicaciones activas. Por defecto, las más nuevas primero;
   * con orden=meGusta, las que tienen más me gusta (y a igualdad, las más nuevas).
   */
  async listar(filtros: ListarPublicacionesDto, idUsuarioActual?: string) {
    const condicion: Record<string, unknown> = { activa: true };
    if (filtros.usuario) condicion.usuario = new Types.ObjectId(filtros.usuario);

    const orden: Record<string, 1 | -1> =
      filtros.orden === 'meGusta' ? { cantidadMeGusta: -1, createdAt: -1 } : { createdAt: -1 };

    const [items, total] = await Promise.all([
      this.publicacionModel
        .find(condicion)
        .sort(orden)
        .skip(filtros.offset)
        .limit(filtros.limit)
        .populate('usuario', CAMPOS_AUTOR)
        .lean<PublicacionLean[]>()
        .exec(),
      this.publicacionModel.countDocuments(condicion).exec(),
    ]);

    return {
      items: items.map((p) => this.aRespuesta(p, idUsuarioActual)),
      total,
      offset: filtros.offset,
      limit: filtros.limit,
    };
  }

  /** Baja lógica: solo el autor o un administrador. */
  async eliminar(id: string, usuario: UserDocument) {
    const publicacion = await this.publicacionModel.findOne({ _id: id, activa: true }).exec();
    if (!publicacion) throw new NotFoundException('La publicación no existe');

    const esAutor = String(publicacion.usuario) === String(usuario._id);
    if (!esAutor && usuario.perfil !== Perfil.Administrador) {
      throw new ForbiddenException('Solo el autor o un administrador pueden eliminar la publicación');
    }

    publicacion.activa = false;
    await publicacion.save();
    return { mensaje: 'Publicación eliminada' };
  }

  /** Agrega un me gusta. La condición del update garantiza que sea uno por usuario. */
  async darMeGusta(id: string, usuario: UserDocument) {
    const { modifiedCount } = await this.publicacionModel
      .updateOne(
        { _id: id, activa: true, meGusta: { $ne: usuario._id } },
        { $push: { meGusta: usuario._id }, $inc: { cantidadMeGusta: 1 } },
      )
      .exec();
    if (modifiedCount === 0) {
      await this.verificarExiste(id);
      throw new ConflictException('Ya le diste me gusta a esta publicación');
    }
    return this.estadoMeGusta(id, true);
  }

  /** Quita un me gusta, solo si el usuario lo había dado. */
  async quitarMeGusta(id: string, usuario: UserDocument) {
    const { modifiedCount } = await this.publicacionModel
      .updateOne(
        { _id: id, activa: true, meGusta: usuario._id },
        { $pull: { meGusta: usuario._id }, $inc: { cantidadMeGusta: -1 } },
      )
      .exec();
    if (modifiedCount === 0) {
      await this.verificarExiste(id);
      throw new ConflictException('No le habías dado me gusta a esta publicación');
    }
    return this.estadoMeGusta(id, false);
  }

  private async verificarExiste(id: string) {
    const existe = await this.publicacionModel.exists({ _id: id, activa: true }).exec();
    if (!existe) throw new NotFoundException('La publicación no existe');
  }

  private async estadoMeGusta(id: string, meGustaPorMi: boolean) {
    const p = await this.publicacionModel.findById(id).select('cantidadMeGusta').lean().exec();
    return { cantidadMeGusta: p?.cantidadMeGusta ?? 0, meGustaPorMi };
  }

  private async buscarParaRespuesta(id: Types.ObjectId, idUsuarioActual: string) {
    const p = await this.publicacionModel
      .findById(id)
      .populate('usuario', CAMPOS_AUTOR)
      .lean<PublicacionLean>()
      .exec();
    return this.aRespuesta(p!, idUsuarioActual);
  }

  /** Arma la respuesta: no expone la lista de quiénes dieron me gusta, solo si fui yo. */
  private aRespuesta(p: PublicacionLean, idUsuarioActual?: string) {
    const { meGusta, activa: _activa, __v: _v, ...resto } = p as PublicacionLean & { __v?: number };
    const id = idUsuarioActual && isValidObjectId(idUsuarioActual) ? idUsuarioActual : null;
    return {
      ...resto,
      // Las publicaciones creadas antes de existir el puntaje no tienen el campo.
      puntaje: resto.puntaje ?? null,
      cantidadComentarios: resto.cantidadComentarios ?? 0,
      meGustaPorMi: id ? meGusta.some((u) => String(u) === id) : false,
    };
  }
}
