export type Perfil = 'usuario' | 'administrador';

export interface Usuario {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  fechaNacimiento: string;
  descripcion: string;
  imagenPerfil: string | null;
  perfil: Perfil;
  activo: boolean;
  createdAt: string;
}

export interface LoginRequest {
  identificador: string;
  password: string;
}


export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}


export type Autor = Pick<Usuario, '_id' | 'nombre' | 'apellido' | 'nombreUsuario' | 'imagenPerfil'>;

export interface Publicacion {
  _id: string;
  titulo: string;
  mensaje: string;
  imagen: string | null;
  /** 1 a 5 estrellas; null si es un debate sin puntuar. */
  puntaje: number | null;
  usuario: Autor;
  cantidadMeGusta: number;
  /** Si el usuario que consulta ya le dio me gusta. */
  meGustaPorMi: boolean;
  createdAt: string;
}

export type OrdenPublicaciones = 'fecha' | 'meGusta';

export interface PaginaPublicaciones {
  items: Publicacion[];
  total: number;
  offset: number;
  limit: number;
}

export interface EstadoMeGusta {
  cantidadMeGusta: number;
  meGustaPorMi: boolean;
}
