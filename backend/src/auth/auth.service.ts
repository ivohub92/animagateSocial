import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { saveImage } from '../common/image-upload.js';
import { UserDocument } from '../users/schemas/user.schema.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { PayloadToken, SESION_INVALIDA } from './token.js';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto, imagen?: Express.Multer.File) {
    if (dto.password !== dto.repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const existente = await this.usersService.existsByCorreoOrNombreUsuario(
      dto.correo,
      dto.nombreUsuario,
    );
    if (existente) {
      throw new ConflictException(
        existente.correo === dto.correo.toLowerCase()
          ? 'El correo ya está registrado'
          : 'El nombre de usuario ya está en uso',
      );
    }

    const { repetirPassword: _, password, ...datos } = dto;
    try {
      const user = await this.usersService.create({
        ...datos,
        fechaNacimiento: new Date(dto.fechaNacimiento),
        password: await bcrypt.hash(password, SALT_ROUNDS),
        imagenPerfil: imagen ? await saveImage(imagen) : null,
      });
      return this.sesion(user);
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

  async login(dto: LoginDto) {
    const user = await this.usersService.findByIdentificador(dto.identificador);
    // bcrypt.compare encripta la contraseña recibida con el salt guardado y compara los hashes.
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    return this.sesion(user);
  }

  /** POST /auth/autorizar: si el token es válido y no venció, devuelve los datos del usuario. */
  async autorizar(token: string) {
    const { usuario } = await this.verificar(token);
    return usuario.toJSON();
  }

  /** POST /auth/refrescar: token nuevo con la misma payload y otros 15 minutos. */
  async refrescar(token: string) {
    const { payload } = await this.verificar(token);
    const { sub, correo, nombreUsuario, perfil } = payload; // sin iat/exp: se generan de nuevo
    return { token: await this.jwt.signAsync({ sub, correo, nombreUsuario, perfil }) };
  }

  /** Respuesta de login y registro: los datos del usuario y su token. */
  private async sesion(user: UserDocument) {
    const payload: PayloadToken = {
      sub: String(user._id),
      correo: user.correo,
      nombreUsuario: user.nombreUsuario,
      perfil: user.perfil,
    };
    return { usuario: user.toJSON(), token: await this.jwt.signAsync(payload) };
  }

  /** Verifica firma y vencimiento, y que el usuario siga existiendo y activo; si no, 401. */
  private async verificar(token: string) {
    let payload: PayloadToken;
    try {
      payload = await this.jwt.verifyAsync<PayloadToken>(token);
    } catch {
      throw new UnauthorizedException(SESION_INVALIDA);
    }
    const usuario = await this.usersService.findById(payload.sub);
    if (!usuario || !usuario.activo) throw new UnauthorizedException(SESION_INVALIDA);
    return { payload, usuario };
  }
}
