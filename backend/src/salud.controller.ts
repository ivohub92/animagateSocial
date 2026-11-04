import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Response } from 'express';
import type { Connection } from 'mongoose';
import { origenesPermitidos } from './common/cors.js';
import { estadoMongo } from './common/estado-mongo.js';

const ESTADOS = ['desconectado', 'conectado', 'conectando', 'desconectando'];
const ESPERA_MAXIMA_MS = 12_000;

/** GET / → indica si el backend está andando y si pudo conectarse a MongoDB. */
@Controller()
export class SaludController {
  constructor(@InjectConnection() private readonly conexion: Connection) {}

  @Get()
  async salud(@Res({ passthrough: true }) res: Response) {
    // Recién iniciado puede estar "conectando": se espera el resultado un momento.
    if (this.conexion.readyState === 2) {
      await Promise.race([
        this.conexion.asPromise().catch(() => undefined),
        new Promise((r) => setTimeout(r, ESPERA_MAXIMA_MS)),
      ]);
    }

    const conectado = this.conexion.readyState === 1;
    res.status(conectado ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return {
      estado: conectado ? 'ok' : 'error',
      mongo: ESTADOS[this.conexion.readyState] ?? 'desconocido',
      error: conectado ? null : estadoMongo.ultimoError,
      variablesDefinidas: {
        MONGODB_URI: Boolean(process.env.MONGODB_URI),
        CORS_ORIGIN: Boolean(process.env.CORS_ORIGIN),
      },
      // Orígenes que el backend acepta (no es un secreto): sirve para revisar CORS.
      corsPermitidos: origenesPermitidos(),
    };
  }
}
