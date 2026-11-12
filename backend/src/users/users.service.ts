import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  /** Todos los usuarios, los más nuevos primero. toJSON saca la contraseña de cada uno. */
  async listar() {
    const usuarios = await this.userModel.find().sort({ createdAt: -1 }).exec();
    return usuarios.map((u) => u.toJSON());
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  existsByCorreoOrNombreUsuario(correo: string, nombreUsuario: string) {
    return this.userModel
      .findOne({ $or: [{ correo: correo.toLowerCase() }, { nombreUsuario }] })
      .select('correo nombreUsuario')
      .lean();
  }

  /** Busca por correo o por nombre de usuario (el login acepta cualquiera de los dos). */
  findByIdentificador(identificador: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        $or: [
          { correo: identificador.toLowerCase() },
          { nombreUsuario: identificador },
        ],
      })
      .exec();
  }
}
