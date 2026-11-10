import { CrearComentarioDto } from './crear-comentario.dto.js';

/** PUT: solo se puede cambiar el mensaje, con las mismas reglas que al crearlo. */
export class EditarComentarioDto extends CrearComentarioDto {}
