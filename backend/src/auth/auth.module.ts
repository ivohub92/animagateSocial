import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { VENCIMIENTO_TOKEN } from './token.js';

@Module({
  imports: [
    UsersModule,
    // global: JwtService queda disponible también para los guards de otros módulos.
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET')?.trim();
        if (!secret) {
          // Sin clave no se pueden firmar tokens: mejor no arrancar que usar una clave conocida.
          throw new Error('Falta la variable de entorno JWT_SECRET (clave para firmar los tokens).');
        }
        return { secret, signOptions: { expiresIn: VENCIMIENTO_TOKEN } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
