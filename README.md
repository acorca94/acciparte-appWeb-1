# Aplicación web multi-tenant con formulario en dos pasos

Stack: React 18 + Vite, Node.js con Express, PostgreSQL
---

## Estructura del proyecto

```
project/
├── schema.sql
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── app.js                        # Express + middlewares
│       ├── server.js                     # Punto de entrada
│       ├── config/db.js                  # Pool de conexiones (pg)
│       ├── middleware/auth.js            # Verificación JWT y guards de rol
│       └── routes/
│           ├── auth.routes.js            # /api/auth
│           ├── partes.routes.js          # /api/submissions
│           └── usuarios.routes.js        # /api/usuarios
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── context/AuthContext.jsx       # Estado de sesión global
        ├── services/api.js               # Axios con interceptores JWT
        ├── components/
        │   ├── RutaPrivada.jsx
        │   └── FormularioParte/
        │       ├── FormularioParte.jsx
        │       ├── Paso1.jsx
        │       └── Paso2.jsx
        └── pages/
            ├── Login.jsx
            ├── Registro.jsx
            ├── Inicio.jsx
            ├── GestionUsuarios.jsx
            ├── RecuperarContrasena.jsx
            └── ResetContrasena.jsx
```

---

## Requisitos previos

- Node.js 18+
- PostgreSQL 14+

---

## Puesta en marcha

### 1. Base de datos

Crea la base de datos y ejecuta el schema:

```bash
createdb multitenant_db
psql multitenant_db -f schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Edita el archivo `.env` con tus valores:

```
DATABASE_URL=postgres://postgres:TU_PASSWORD@localhost:5432/multitenant_db
JWT_SECRET=una_clave_larga_y_secreta
JWT_EXPIRES_IN=8h
PORT=3001
CLIENT_URL=http://localhost:5173
```

```bash
npm install
npm run dev
```

El API escucha en `http://localhost:3001`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

La app abre en `http://localhost:5173`.
Vite hace proxy de `/api` → `localhost:3001`, por lo que no hay problemas de CORS en desarrollo.

---

## Modelo de datos

```
tenants
  id            UUID PK
  slug          VARCHAR(60) UNIQUE   -- identificador de la organización en el login
  name          VARCHAR(120)
  created_at    TIMESTAMP

users
  id                  UUID PK
  tenant_id           UUID FK → tenants(id)
  email               VARCHAR(255)
  password_hash       VARCHAR(255)
  role                VARCHAR(20)        -- 'user' | 'admin'
  reset_token         VARCHAR(64)        -- token temporal para recuperar contraseña
  reset_token_expira  TIMESTAMP
  created_at          TIMESTAMP
  UNIQUE(tenant_id, email)

submissions
  id              UUID PK
  tenant_id       UUID FK → tenants(id)
  user_id         UUID FK → users(id)
  nombre          VARCHAR(150)
  apellidos       VARCHAR(150)
  lugar           VARCHAR(200)
  hora_accidente  VARCHAR(20)            -- franja horaria del incidente
  created_at      TIMESTAMP
```

---

## Endpoints implementados

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Crea tenant + primer usuario admin |
| POST | `/api/auth/login` | No | Devuelve JWT |
| POST | `/api/auth/recuperar-contrasena` | No | Genera token de reset (1 hora de validez) |
| POST | `/api/auth/reset-contrasena` | No | Restablece contraseña con el token |

### Partes de accidente

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/submissions` | JWT | Lista los partes del tenant |
| GET | `/api/submissions/:id` | JWT | Obtiene un parte concreto |
| POST | `/api/submissions` | JWT | Crea un parte (datos del formulario) |
| DELETE | `/api/submissions/:id` | JWT | Elimina un parte |
| GET | `/api/submissions/meta/horas` | JWT | Devuelve las franjas horarias válidas |

### Gestión de usuarios (solo admins)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/usuarios` | JWT + admin | Lista usuarios del tenant |
| POST | `/api/usuarios` | JWT + admin | Crea un nuevo usuario en el tenant |
| DELETE | `/api/usuarios/:id` | JWT + admin | Elimina un usuario del tenant |

### Ejemplo de login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"tenantSlug":"mi-empresa","email":"admin@ejemplo.com","password":"secreto123"}'
```

Respuesta: `{ "token": "eyJ..." }`

### Ejemplo de crear un parte

```bash
curl -X POST http://localhost:3001/api/submissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellidos": "García Martínez",
    "lugar": "Autovía A-4, km 22",
    "hora_accidente": "10:00 - 12:00"
  }'
```

---

## Aislamiento multi-tenant

El aislamiento se garantiza en tres niveles:

1. **JWT firmado**: al autenticarse, el token incluye `tenantId` firmado con el secreto del servidor. No puede manipularse sin invalidar la firma.

2. **Capa de datos**: todas las queries filtran por `tenant_id` usando el valor extraído del token, nunca el que pueda venir del cuerpo de la petición. Por ejemplo:
   ```js
   db.query('SELECT * FROM submissions WHERE id = $1 AND tenant_id = $2',
             [req.params.id, req.user.tenantId])
   ```
   Aunque un usuario malicioso envíe un `tenant_id` diferente en el body, la query siempre usa el del token.

3. **Restricciones en base de datos**: la columna `tenant_id` tiene clave foránea con índice, y la constraint `UNIQUE(tenant_id, email)` garantiza que el mismo email puede existir en distintos tenants sin colisión.

Cualquier query que toque datos de usuario lleva siempre tenant_id del token, 
no del body. Así aunque alguien manipule la petición, solo ve sus propios datos.
---

## Flujo de uso

1. Ir a `/register` → crear organización (tenant) y primer usuario administrador.
2. Ir a `/login` → introducir slug de organización, email y contraseña.
3. En el panel principal, pulsar **"+ Nuevo registro"** para abrir el formulario en dos pasos:
   - **Paso 1**: nombre, apellidos y lugar del incidente.
   - **Paso 2**: franja horaria del accidente.
4. Los admins pueden gestionar usuarios de su organización desde el botón **"Usuarios"** en el panel.
5. Si se olvida la contraseña, usar el enlace **"¿Olvidaste tu contraseña?"** en la pantalla de login. 
El token se genera correctamente en base de datos, aunque el envío del email requiere configurar  un 
servicio externo tipo SendGrid o Resend en producción.