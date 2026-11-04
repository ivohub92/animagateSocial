import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { memoryStorage } from 'multer';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');

/**
 * Si está definida CLOUDINARY_URL (cloudinary://API_KEY:API_SECRET@CLOUD_NAME) las imágenes
 * se suben a Cloudinary; si no, se guardan en /uploads. En Render conviene Cloudinary,
 * porque el disco del plan gratuito se borra en cada deploy.
 */
export const usaCloudinary = () => Boolean(process.env.CLOUDINARY_URL);

/**
 * La imagen se mantiene en memoria y solo se guarda cuando el resto
 * de los datos ya fueron validados (así no quedan archivos huérfanos).
 */
export const imageUploadOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(
        new BadRequestException('La imagen debe ser JPG, PNG, WEBP o GIF'),
        false,
      );
    }
    cb(null, true);
  },
};

/** Guarda la imagen (en Cloudinary o en disco) y devuelve su URL pública. */
export async function saveImage(
  file: Express.Multer.File,
  carpeta = 'perfiles',
): Promise<string> {
  return usaCloudinary() ? subirACloudinary(file, carpeta) : guardarEnDisco(file);
}

function subirACloudinary(file: Express.Multer.File, carpeta: string): Promise<string> {
  // Relee CLOUDINARY_URL ahora: el SDK la lee al importarse, antes de que Nest cargue el .env.
  cloudinary.config(true);
  cloudinary.config({ secure: true });
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: `agora/${carpeta}`, resource_type: 'image' },
        (error, resultado?: UploadApiResponse) => {
          if (error || !resultado) {
            console.error('Error al subir a Cloudinary:', error?.message);
            return reject(
              new ServiceUnavailableException('No se pudo guardar la imagen. Intente nuevamente.'),
            );
          }
          resolve(resultado.secure_url);
        },
      )
      .end(file.buffer);
  });
}

/**
 * URL pública del backend: PUBLIC_URL si está definida; en Render se usa la que
 * provee automáticamente (RENDER_EXTERNAL_URL); en local, localhost.
 */
function urlPublica(): string {
  return (
    process.env.PUBLIC_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`
  );
}

async function guardarEnDisco(file: Express.Multer.File): Promise<string> {
  await mkdir(UPLOADS_DIR, { recursive: true });
  const filename = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
  await writeFile(join(UPLOADS_DIR, filename), file.buffer);
  return `${urlPublica()}/uploads/${filename}`;
}
