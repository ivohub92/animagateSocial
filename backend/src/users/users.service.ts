import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { RegisterDto } from '../auth/dto/register.dto.js';
import { saveImage } from '../common/image-upload.js';
import { Perfil, User, UserDocument } from './schemas/user.schema.js';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  /**
   * Alta de un usuario. La usan el registro público (siempre perfil "usuario") y el alta de un
   * administrador (POST /usuarios, que puede elegir el perfil).
   */
  async registrar(dto: RegisterDto, imagen?: Express.Multer.File, perfil = Perfil.Usuario) {
    if (dto.password !== dto.repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const existente = await this.existsByCorreoOrNombreUsuario(dto.correo, dto.nombreUsuario);
    if (existente) {
      throw new ConflictException(
        existente.correo === dto.correo.toLowerCase()
          ? 'El correo ya está registrado'
          : 'El nombre de usuario ya está en uso',
      );
    }

    // perfil y repetirPassword no se copian tal cual: el perfil lo decide quien llama.
    const { repetirPassword: _r, password, perfil: _p, ...datos } = dto as RegisterDto & { perfil?: Perfil };
    try {
      return await this.create({
        ...datos,
        perfil,
        fechaNacimiento: new Date(dto.fechaNacimiento),
        password: await bcrypt.hash(password, SALT_ROUNDS),
        imagenPerfil: imagen ? await saveImage(imagen) : null,
      });
    } catch (err) {
      // Dos registros simultáneos con el mismo dato pasan la verificación de arriba,
      // pero el índice único de MongoDB rechaza el segundo (error 11000): es un 409, no un 500.
      if ((err as { code?: number }).code === 11000) {
        const campo = Object.keys((err as { keyPattern?: object }).keyPattern ?? {})[0];
        throw new ConflictException(
          campo === 'nombreUsuario'
            ? 'El nombre de usuario ya está en uso'
            : 'El correo ya está registrado',
        );
      }
      throw err;
    }
  }

  /** Baja lógica: el usuario queda con activo = false y ya no puede ingresar. */
  async deshabilitar(id: string, admin: UserDocument) {
    if (String(admin._id) === id) {
      // Si no, un administrador podría dejarse afuera a sí mismo (y quizás al sistema sin admins).
      throw new BadRequestException('No podés deshabilitar tu propia cuenta');
    }
    const usuario = await this.buscarOFallar(id);
    if (!usuario.activo) throw new ConflictException('El usuario ya está deshabilitado');
    usuario.activo = false;
    await usuario.save();
    return usuario.toJSON();
  }

  /** Alta lógica: rehabilita a un usuario deshabilitado para que vuelva a usar la aplicación. */
  async habilitar(id: string) {
    const usuario = await this.buscarOFallar(id);
    if (usuario.activo) throw new ConflictException('El usuario ya está habilitado');
    usuario.activo = true;
    await usuario.save();
    return usuario.toJSON();
  }

  private async buscarOFallar(id: string) {
    const usuario = await this.findById(id);
    if (!usuario) throw new NotFoundException('El usuario no existe');
    return usuario;
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
