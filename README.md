# AnimeGate · Red social (Programación IV – TP 2)

| Carpeta     | Tecnología          |
|-------------|---------------------|
| `frontend/` | Angular 21 (tema AnimeGate: oscuro, neón y paneles de vidrio) |
| `backend/`  | NestJS 12 + MongoDB |

## Sprint 1 – qué incluye

**Front**
- Pantallas: Acceso, Publicaciones y Mi perfil, con navegación libre entre ellas (navbar).
- **Login y registro en la misma página** (`/login`), con pestañas "Iniciar sesión" / "Registrarse".
  La pestaña viaja en la URL (`/login?tab=registro`) y la vieja ruta `/registro` redirige ahí.
- Favicon propio (`frontend/public/favicon.svg`).
- Login por **correo o nombre de usuario** (ambos únicos en la base) con validaciones y mensajes.
- Contraseña: mínimo 8 caracteres, una mayúscula y un número (validado en front y back).
- Registro con nombre, apellido, correo, nombre de usuario, contraseña, repetir contraseña,
  fecha de nacimiento, descripción breve e imagen de perfil (input `file` con vista previa).
- Mensajes en **modales** propios (nunca `alert()`).

**Back**
- Módulos `auth`, `users` (usuarios) y `publicaciones`.
- `POST /auth/registro` (multipart/form-data, archivo en el campo `imagenPerfil`):
  valida los datos, encripta la contraseña con bcrypt, guarda la imagen (en Cloudinary si
  está configurado, si no en `uploads/`) y su URL en la base. Responde **201**; **400** si hay datos inválidos;
  **409** si el correo o el usuario ya existen.
- `POST /auth/login` (`{ identificador, password }`): compara la contraseña con bcrypt
  y devuelve todos los datos del usuario (sin la contraseña). **200** / **401** / **400**.
- Los usuarios tienen el atributo `perfil` (`usuario` por defecto, o `administrador`).

## Sprint 2 – Publicaciones

**API** (`/publicaciones`)

| Método y ruta | Qué hace | Status |
|---|---|---|
| `GET /publicaciones?orden=fecha\|meGusta&offset=0&limit=10&usuario=<id>` | Listado paginado (por fecha por defecto) | 200 · 400 si los parámetros no son válidos |
| `POST /publicaciones` (multipart: `titulo`, `mensaje`, `imagen` opcional, `puntaje` opcional de 1 a 5) | Crea una publicación del usuario. Sin `puntaje` es un debate (`puntaje: null`) | 201 · 400 (también si el puntaje no es un entero de 1 a 5) · 401 |
| `DELETE /publicaciones/:id` | Baja lógica (`activa = false`), solo el autor o un administrador | 200 · 403 · 404 |
| `POST /publicaciones/:id/me-gusta` | Da me gusta (uno por usuario) | 201 · 409 si ya lo había dado |
| `DELETE /publicaciones/:id/me-gusta` | Quita el me gusta, solo si lo había dado | 200 · 409 |
| `GET /publicaciones/:id/comentarios?offset=0&limit=20` | (Sprint 3) Comentarios de la publicación, los más recientes primero | 200 · 404 · 400 |
| `POST /publicaciones/:id/comentarios` (`{ mensaje }`, máx. 500) | (Sprint 3) Comenta con el usuario del header; la fecha la pone `createdAt` | 201 · 400 · 401 · 404 |

> **Usuario que hace el pedido (temporal):** hasta el Sprint 3 (JWT), el front envía el id del usuario
> logueado en el header `X-Usuario-Id` (interceptor `usuario.interceptor.ts`). El backend lo valida en
> `UsuarioActualGuard` (`common/usuario-actual.ts`) y responde 401 si falta o no es un usuario activo.
> En el Sprint 3 se reemplaza por el token del header `Authorization` cambiando solo esos dos archivos.

**Front** (pantalla Publicaciones)
- Listado de 5 por página con **Anterior / Siguiente**, ordenado por fecha; selector **Más recientes / Más me gusta**.
- Cada publicación es un componente (`shared/publicacion`): autor, título, mensaje, imagen, me gusta.
- **Me gusta**: se marca o desmarca al instante y se revierte si el servidor responde error.
- **Eliminar**: solo en las publicaciones propias, con un modal de confirmación.
- Caja para publicar (título, mensaje e imagen opcional).


### Sprint 2 · publicaciones

`postman/animegate-sprint2.postman_collection.json` tiene **37 consultas** (73 verificaciones) para el
módulo publicaciones. Usa dos usuarios que crea la carpeta 0 (Ana y Beto) y manda el usuario en el header
`X-Usuario-Id`.

| Carpeta | Qué prueba |
|---|---|
| 0 · Preparación | Salud del backend y registro de Ana y Beto (guarda sus `_id`) |
| 1 · Alta | 201 con puntaje y sin puntaje (debate), con imagen; 401 sin usuario; 400 por título, mensaje, puntaje y campos no permitidos |
| 2 · Listado | Orden por fecha por defecto, `offset`/`limit` (paginado), filtro `usuario`; 400 por parámetros inválidos |
| 3 · Me gusta | 201 al dar, 409 si se repite, `meGustaPorMi`, orden por me gusta, 200 al quitar, 409 si no lo había dado, 401/404/400 |
| 4 · Baja lógica | 403 si no es el autor, 401, 200 al eliminar, desaparece del listado, 404 al repetir |


