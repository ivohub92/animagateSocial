import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../users/schemas/user.schema.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { CUENTA_DESHABILITADA, PayloadToken, SESION_INVALIDA } from './token.js';


@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto, imagen?: Express.Multer.File) {
    // El registro público siempre crea perfil "usuario" (el DTO ni siquiera acepta el campo).
    const user = await this.usersService.registrar(dto, imagen);
    return this.sesion(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByIdentificador(dto.identificador);
    // bcrypt.compare encripta la contraseña recibida con el salt guardado y compara los hashes.
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    // Recién con la contraseña correcta se avisa que la cuenta está deshabilitada:
    // así no se revela el estado de una cuenta a quien no sabe su contraseña.
    if (!user.activo) throw new ForbiddenException(CUENTA_DESHABILITADA);
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
    if (!usuario) throw new UnauthorizedException(SESION_INVALIDA);
    if (!usuario.activo) throw new UnauthorizedException(CUENTA_DESHABILITADA);
    return { payload, usuario };
  }
}
