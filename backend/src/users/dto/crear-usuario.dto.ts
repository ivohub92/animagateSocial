import { IsEnum, IsOptional } from 'class-validator';
import { RegisterDto } from '../../auth/dto/register.dto.js';
import { Perfil } from '../schemas/user.schema.js';

/**
 * POST /usuarios (solo administradores): los mismos datos que el registro, más el perfil.
 * En el registro público "perfil" no existe en el DTO, así que nadie puede autoasignarse admin.
 */
export class CrearUsuarioDto extends RegisterDto {
  @IsOptional()
  @IsEnum(Perfil, { message: 'El perfil debe ser "usuario" o "administrador"' })
  perfil?: Perfil;
}
