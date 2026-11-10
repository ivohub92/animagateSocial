import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageUploadOptions } from '../common/image-upload.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { tokenObligatorio } from './token.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /auth/registro (multipart/form-data, campo de archivo: "imagenPerfil") → 201 { usuario, token } */
  @Post('registro')
  @UseInterceptors(FileInterceptor('imagenPerfil', imageUploadOptions))
  register(
    @Body() dto: RegisterDto,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.authService.register(dto, imagen);
  }

  /** POST /auth/login → 200 { usuario, token }, 401 si las credenciales no son válidas */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** POST /auth/autorizar (Authorization: Bearer <token>) → 200 con el usuario, 401 si el token no sirve */
  @Post('autorizar')
  @HttpCode(HttpStatus.OK)
  autorizar(@Headers('authorization') authorization?: string) {
    return this.authService.autorizar(tokenObligatorio(authorization));
  }

  /** POST /auth/refrescar (Authorization: Bearer <token>) → 200 { token } nuevo, 401 si no sirve */
  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  refrescar(@Headers('authorization') authorization?: string) {
    return this.authService.refrescar(tokenObligatorio(authorization));
  }
}
