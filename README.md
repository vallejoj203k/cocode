# 🐍 Python Kids — Plataforma del curso

Plataforma web para gestionar un curso de Python desde cero dirigido a niños de 8 a 10 años:
11 meses, una clase de una hora por semana, organizado en **11 módulos de 4 clases** (44 clases).

Centraliza el currículo, la gestión de usuarios por rol, el seguimiento del avance y la
asistencia de cada estudiante, el buzón de sugerencias y el control financiero del negocio.

---

## Stack

| Capa           | Tecnología                                    |
| -------------- | --------------------------------------------- |
| Frontend       | React 18 + Vite + Tailwind CSS + React Router  |
| Backend        | Node.js + Express 4                           |
| Base de datos  | PostgreSQL + Prisma ORM                       |
| Autenticación  | JWT + middleware de autorización por rol      |
| Despliegue     | Railway (backend, frontend y Postgres)        |

Monorepo con workspaces de npm: `backend/` y `frontend/`.

---

## Puesta en marcha local

Requisitos: Node.js 20+ y una base PostgreSQL accesible.

```bash
# 1. Dependencias (instala backend y frontend)
npm install

# 2. Configuración
cp .env.example backend/.env       # ajusta DATABASE_URL y JWT_SECRET

# 3. Base de datos: crea las tablas y siembra el currículo
npm run db:migrate
npm run db:seed

# 4. Levantar backend (:4000) y frontend (:5173) a la vez
npm run dev
```

Abre <http://localhost:5173>. El proxy de Vite envía `/api` al backend, así que no hay que
configurar CORS en desarrollo.

### Cuentas que crea el seed

| Rol                   | Correo                        | Contraseña  |
| --------------------- | ----------------------------- | ----------- |
| Administrador         | `admin@pythonkids.com`        | `Admin123*` |
| Tutor                 | `ana.tutora@pythonkids.com`   | `Demo1234*` |
| Tutor                 | `carlos.tutor@pythonkids.com` | `Demo1234*` |
| Estudiante / acudiente| `familia.gomez@correo.com`    | `Demo1234*` |

> Los datos de ejemplo (tutores, familias, grupos, pagos) solo se crean si `SEED_DEMO`
> no es `false`. En producción usa `SEED_DEMO=false` para sembrar únicamente el currículo
> y la cuenta de administrador — y cambia la contraseña del admin al primer ingreso.

---

## Roles y permisos

| Acción                                   | Admin | Tutor            | Estudiante/Acudiente |
| ---------------------------------------- | :---: | :--------------: | :------------------: |
| Ver currículo                            |  ✅   | ✅ (solo lectura) | ✅ (solo lectura)     |
| Editar módulos y clases                  |  ✅   | ❌               | ❌                    |
| Gestionar usuarios                       |  ✅   | ❌               | ❌                    |
| Gestionar estudiantes y grupos           |  ✅   | ❌               | ❌                    |
| Ver estudiantes                          | todos | solo sus grupos  | solo sus hijos        |
| Registrar avance de clases               |  ✅   | ✅ (sus grupos)   | ❌                    |
| Tomar asistencia y dejar observaciones   |  ✅   | ✅ (sus grupos)   | ❌                    |
| Ver su propio avance y asistencia        |  ✅   | ✅               | ✅                    |
| Enviar sugerencias                       |  ✅   | ✅               | ✅                    |
| Responder sugerencias                    |  ✅   | ❌               | ❌                    |
| Módulo financiero                        |  ✅   | ❌               | ❌                    |

El control se aplica en el backend (middleware `authorize` + filtros por rol en cada
consulta), no solo en la interfaz: entrar por URL directa a una sección ajena devuelve 403.

---

## Modelo de datos

```
User ─┬─< Group (tutor)
      ├─< Student (cuenta de acceso de la familia)
      └─< Suggestion / Payment / Expense (autor o registrador)

Student ─┬─< StudentGroup >─ Group
         ├─< Attendance >─ GroupProgress >─ Class >─ Module
         └─< Payment
```

### Por qué `Student` está separado de `User`

El documento de contexto dejaba una decisión abierta: como los estudiantes tienen 8-10 años,
quien realmente usa la cuenta es el padre o acudiente. En vez de crear un rol extra, el
modelo separa dos cosas:

- **`User` con rol `ESTUDIANTE`** es la cuenta de acceso de la familia.
- **`Student`** es el niño que toma el curso: asistencia, grupo y pagos apuntan aquí.

Un `Student` puede tener o no cuenta vinculada (`userId`), y **una misma cuenta puede tener
varios hijos** — así una familia con dos hermanos en el curso entra una sola vez y ve el
avance de ambos. Si más adelante se quiere un rol `ACUDIENTE` explícito, basta con agregarlo
al enum sin tocar el resto del modelo.

Otras decisiones:

- Las bajas de usuarios y estudiantes son **lógicas** (`activo = false`): se conserva el
  historial de asistencia y pagos.
- La relación módulo → clase **no fuerza** las 4 clases por módulo, para poder flexibilizarla.
- `Payment` no tiene restricción de unicidad por periodo: un mes puede cubrirse con varios
  abonos, y el estado de cartera suma los pagos del periodo.
- Los montos usan `Decimal(12,2)` y se serializan como número en las respuestas JSON.

---

## API REST

Todas las rutas cuelgan de `/api` y, salvo el login, requieren la cabecera
`Authorization: Bearer <token>`.

### Autenticación
| Método | Ruta                        | Quién  | Descripción                          |
| ------ | --------------------------- | ------ | ------------------------------------ |
| POST   | `/auth/login`               | todos  | Devuelve el token y el usuario       |
| GET    | `/auth/me`                  | sesión | Usuario, sus estudiantes o sus grupos|
| POST   | `/auth/change-password`     | sesión | Cambia la propia contraseña          |

### Currículo
| Método | Ruta                                  | Quién  |
| ------ | ------------------------------------- | ------ |
| GET    | `/curriculum/modules`                 | sesión |
| GET    | `/curriculum/modules/:id`             | sesión |
| POST   | `/curriculum/modules`                 | admin  |
| PATCH  | `/curriculum/modules/:id`             | admin  |
| DELETE | `/curriculum/modules/:id`             | admin  |
| GET    | `/curriculum/classes/:id`             | sesión |
| POST   | `/curriculum/modules/:moduleId/classes` | admin |
| PATCH  | `/curriculum/classes/:id`             | admin  |
| DELETE | `/curriculum/classes/:id`             | admin  |

Borrar un módulo o clase con historial de clases dictadas responde `409`; hay que repetir
la petición con `?force=true` para confirmar.

### Usuarios y estudiantes
| Método | Ruta                | Quién  | Notas                                     |
| ------ | ------------------- | ------ | ----------------------------------------- |
| GET    | `/users`            | admin  | Filtros: `rol`, `search`, `activo`, `page`|
| POST   | `/users`            | admin  |                                           |
| PATCH  | `/users/:id`        | admin  |                                           |
| DELETE | `/users/:id`        | admin  | Baja lógica                               |
| GET    | `/students`         | sesión | Alcance según rol                         |
| GET    | `/students/:id`     | sesión | Incluye resumen de asistencia             |
| POST   | `/students`         | admin  |                                           |
| PATCH  | `/students/:id`     | admin  |                                           |
| DELETE | `/students/:id`     | admin  | Baja lógica + retiro de grupos            |

### Grupos, avance y asistencia
| Método | Ruta                                            | Quién             |
| ------ | ----------------------------------------------- | ----------------- |
| GET    | `/groups`                                       | sesión (alcance)  |
| GET    | `/groups/:id`                                   | sesión (alcance)  |
| POST / PATCH / DELETE | `/groups[/:id]`                  | admin             |
| POST   | `/groups/:id/students`                          | admin             |
| DELETE | `/groups/:id/students/:studentId`               | admin             |
| GET    | `/groups/:id/progress`                          | sesión (alcance)  |
| PUT    | `/groups/:id/progress/:classId`                 | admin o su tutor  |
| GET    | `/groups/:id/progress/:classId/attendance`      | sesión (alcance)  |
| PUT    | `/groups/:id/progress/:classId/attendance`      | admin o su tutor  |

Guardar asistencia marca la clase como dictada automáticamente.

### Sugerencias
| Método | Ruta                | Quién  | Notas                                  |
| ------ | ------------------- | ------ | -------------------------------------- |
| POST   | `/suggestions`      | sesión |                                        |
| GET    | `/suggestions`      | sesión | Admin ve todas; el resto solo las suyas|
| PATCH  | `/suggestions/:id`  | admin  | Estado y respuesta                     |
| DELETE | `/suggestions/:id`  | admin  |                                        |

### Módulo financiero (solo admin)
| Método | Ruta                                        | Descripción                            |
| ------ | ------------------------------------------- | -------------------------------------- |
| GET / POST / PATCH / DELETE | `/finance/payments[/:id]`  | Ingresos                     |
| GET / POST / PATCH / DELETE | `/finance/expenses[/:id]`  | Gastos                       |
| GET    | `/finance/summary?desde&hasta`              | Balance mensual y gastos por categoría |
| GET    | `/finance/cartera?periodo=YYYY-MM`          | Quién está al día y quién debe         |
| GET    | `/finance/export?tipo=payments\|expenses\|cartera` | Exportación CSV                 |

### Otros
| Método | Ruta         | Descripción                                    |
| ------ | ------------ | ---------------------------------------------- |
| GET    | `/dashboard` | Resumen adaptado al rol de quien lo consulta   |
| GET    | `/health`    | Estado del servicio y de la base (sin auth)    |

---

## Despliegue en Railway

El backend sirve el build del frontend cuando existe `frontend/dist`, así que basta **un
solo servicio web** más el plugin de Postgres. Es la opción recomendada: sin CORS y con una
sola URL.

1. **Crea el proyecto** en Railway y añade el plugin **PostgreSQL**.
2. **Añade el servicio** desde este repositorio. `railway.json` ya define:
   - build: `npm run build` (compila el frontend; `prisma generate` corre en el postinstall)
   - start: `npm start` → `prisma migrate deploy` y luego el servidor
   - healthcheck: `/health`
3. **Configura las variables** del servicio:

   | Variable            | Valor                            |
   | ------------------- | -------------------------------- |
   | `DATABASE_URL`      | `${{Postgres.DATABASE_URL}}`     |
   | `JWT_SECRET`        | `openssl rand -base64 48`        |
   | `NODE_ENV`          | `production`                     |
   | `CORS_ORIGINS`      | `*`                              |
   | `VALOR_MENSUALIDAD` | valor de la mensualidad          |
   | `SEED_DEMO`         | `false`                          |
   | `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | credenciales del primer admin |

   `PORT` lo inyecta Railway.
4. **Siembra el currículo** una sola vez, desde la consola del servicio:
   ```bash
   npm run db:seed
   ```
5. Genera el dominio público y entra con la cuenta de administrador.

### Alternativa: frontend y backend separados

Si prefieres dos servicios, despliega el frontend con `npm run build -w frontend` sirviendo
`frontend/dist` como estático, define `VITE_API_URL` con la URL pública del backend y pon en
`CORS_ORIGINS` el dominio del frontend.

---

## Scripts

| Comando               | Qué hace                                             |
| --------------------- | ---------------------------------------------------- |
| `npm run dev`         | Backend y frontend en paralelo                       |
| `npm run build`       | Compila el frontend                                  |
| `npm start`           | Aplica migraciones y arranca el backend en producción|
| `npm run db:migrate`  | Crea y aplica una migración (desarrollo)             |
| `npm run db:push`     | Sincroniza el esquema sin migración (prototipado)    |
| `npm run db:seed`     | Siembra currículo, admin y datos de ejemplo          |
| `npm run db:generate` | Regenera el cliente de Prisma                        |

---

## Estructura

```
backend/
  prisma/
    schema.prisma      modelo de datos
    curriculum.js      los 11 módulos y sus 44 clases
    seed.js            siembra idempotente
  src/
    app.js, server.js  arranque de Express
    config/            variables de entorno validadas
    middleware/        auth, validación (zod) y errores
    routes/            un archivo por área funcional
    services/          cálculos de balance y cartera
frontend/
  src/
    api/               cliente HTTP y manejo del token
    context/           sesión (AuthContext)
    components/        layout, rutas protegidas y UI compartida
    pages/             una vista por sección, diferenciada por rol
```
