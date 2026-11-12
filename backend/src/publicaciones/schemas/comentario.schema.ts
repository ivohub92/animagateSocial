import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema.js';
import { Publicacion } from './publicacion.schema.js';

export type ComentarioDocument = HydratedDocument<Comentario>;

/** Comentario de un usuario en una publicación. createdAt es la fecha del comentario. */
@Schema({ timestamps: true })
export class Comentario {
  @Prop({ type: Types.ObjectId, ref: Publicacion.name, required: true })
  publicacion: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  usuario: Types.ObjectId;

  @Prop({ required: true, trim: true })
  mensaje: string;

  /** true cuando el autor editó el comentario (el front muestra "editado"). */
  @Prop({ default: false })
  modificado: boolean;

  /** Baja lógica: cuando se da de baja la publicación, sus comentarios también (Sprint 4). */
  @Prop({ default: true })
  activa: boolean;

  createdAt: Date;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);
// Los comentarios siempre se piden por publicación, del más nuevo al más viejo.
ComentarioSchema.index({ publicacion: 1, createdAt: -1 });
