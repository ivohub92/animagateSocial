import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum Perfil {
  Usuario = 'usuario',
  Administrador = 'administrador',
}

@Schema({
  timestamps: true,
  toJSON: {
    // Nunca exponer la contraseña en las respuestas.
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, trim: true })
  apellido: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  correo: string;

  @Prop({ required: true, unique: true, trim: true })
  nombreUsuario: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  fechaNacimiento: Date;

  @Prop({ default: '' })
  descripcion: string;

  @Prop({ type: String, default: null })
  imagenPerfil: string | null;

  @Prop({ type: String, enum: Perfil, default: Perfil.Usuario })
  perfil: Perfil;

  @Prop({ default: true })
  activo: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
