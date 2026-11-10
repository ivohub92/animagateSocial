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
  Desde el Sprint 3, registro y login responden `{ usuario, token }`.
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

> Las rutas que necesitan sesión piden el token JWT en el header `Authorization: Bearer <token>` (Sprint 3).

**Front** (pantalla Publicaciones)
- Listado de 5 por página con **Anterior / Siguiente**, ordenado por fecha; selector **Más recientes / Más me gusta**.
- Cada publicación es un componente (`shared/publicacion`): autor, título, mensaje, imagen, me gusta.
- **Me gusta**: se marca o desmarca al instante y se revierte si el servidor responde error.
- **Eliminar**: solo en las publicaciones propias, con un modal de confirmación.
- Caja para publicar (título, mensaje e imagen opcional).

## Sprint 3 – JWT y comentarios

**Back**

| Método y ruta | Qué hace | Status |
|---|---|---|
| `POST /auth/registro` · `POST /auth/login` | Devuelven `{ usuario, token }`. El token JWT lleva id, correo, nombre de usuario y rol, y vence a los **15 minutos** | 201 / 200 · 400 · 401 · 409 |
| `POST /auth/autorizar` (`Authorization: Bearer <token>`) | Si el token es válido y no venció, devuelve los datos del usuario | 200 · 401 |
| `POST /auth/refrescar` (`Authorization: Bearer <token>`) | Devuelve `{ token }` nuevo, con la misma payload y otros 15 minutos | 200 · 401 |
| `GET /publicaciones/:id` | Una publicación, para verla en grande | 200 · 404 |
| `GET /publicaciones/:id/comentarios?offset=0&limit=20` | Comentarios paginados, los más recientes primero | 200 · 400 · 404 |
| `POST /publicaciones/:id/comentarios` (`{ mensaje }`, máx. 500) | Agrega un comentario con el usuario del token y la fecha (`createdAt`) | 201 · 400 · 401 · 404 |
| `PUT /publicaciones/:id/comentarios/:idComentario` (`{ mensaje }`) | Edita el mensaje y marca `modificado: true`; solo quien lo escribió | 200 · 400 · 401 · 403 · 404 |

- El token se firma con la variable de entorno **`JWT_SECRET`** (obligatoria: sin ella el backend no arranca).
  En Render: **Environment → Add Environment Variable → `JWT_SECRET`** con una clave larga y secreta.
- `UsuarioActualGuard` (`common/usuario-actual.ts`) verifica firma y vencimiento del token y responde 401;
  `UsuarioOpcionalGuard` lo usa el listado, que funciona con o sin sesión.

**Front**
- El token se guarda en `localStorage` y el interceptor (`core/auth.interceptor.ts`) lo manda en cada pedido.
- **Pantalla de carga** al iniciar (`/`): spinner mientras valida el token con `/auth/autorizar`; si sirve va a
  publicaciones, si no, al login.
- **Aviso de sesión** (`core/sesion.service.ts`): a los 10 minutos un modal avisa que quedan 5 y pregunta si
  extender la sesión; si se acepta, se refresca el token.
- Si una petición devuelve **401**, se cierra la sesión y se vuelve al login.
- **Página de la publicación** (`/publicaciones/:id`): la publicación en grande con sus comentarios, de a 5,
  con **Cargar más** (agrega los siguientes sin perder los anteriores). Cada uno puede **editar** sus
  comentarios, y los editados dicen *editado*.

## Postman

| Colección | Consultas |
|---|---|
| `postman/animegate-sprint1.postman_collection.json` | Registro y login (25) |
| `postman/animegate-sprint2.postman_collection.json` | Publicaciones y me gusta (37) |
| `postman/animegate-sprint3.postman_collection.json` | JWT y comentarios (27) |

En cada una: **Import**, cambiar la variable `baseUrl` (local o Render) y **Run collection** sin cambiar el
orden. La carpeta 0 crea los usuarios y guarda sus tokens, que duran 15 minutos.

### Sprint 2 · publicaciones

`postman/animegate-sprint2.postman_collection.json` tiene **37 consultas** (73 verificaciones) para el
módulo publicaciones. Usa dos usuarios que crea la carpeta 0 (Ana y Beto), cada uno con su token.

| Carpeta | Qué prueba |
|---|---|
| 0 · Preparación | Salud del backend y registro de Ana y Beto (guarda sus `_id` y tokens) |
| 1 · Alta | 201 con puntaje y sin puntaje (debate), con imagen; 401 sin usuario; 400 por título, mensaje, puntaje y campos no permitidos |
| 2 · Listado | Orden por fecha por defecto, `offset`/`limit` (paginado), filtro `usuario`; 400 por parámetros inválidos |
| 3 · Me gusta | 201 al dar, 409 si se repite, `meGustaPorMi`, orden por me gusta, 200 al quitar, 409 si no lo había dado, 401/404/400 |
| 4 · Baja lógica | 403 si no es el autor, 401, 200 al eliminar, desaparece del listado, 404 al repetir |


