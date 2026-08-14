# 🐍 Python Kids — Plataforma del curso

Plataforma web para gestionar los cursos de programación para niños. Nace con el curso de
Python desde cero para niños de 8 a 10 años —11 meses, una clase de una hora por semana,
organizado en **11 módulos de 4 clases** (44 clases)— y admite **varios cursos en paralelo**,
cada uno con su propio currículo.

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
| Crear y editar cursos                    |  ✅   | ❌               | ❌                    |
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

### Dos entradas

La plataforma tiene dos pantallas de acceso a la misma cuenta y contraseña:

| Ruta              | Para quién                | Cómo es                                              |
| ----------------- | ------------------------- | ---------------------------------------------------- |
| `/login`          | administradores y tutores | Formulario compacto, el de siempre                    |
| `/soy-estudiante` | estudiantes               | Texto grande, lenguaje sencillo y botón de ver la contraseña, porque la usa el niño (8-10 años) por su cuenta |

Cada pantalla enlaza a la otra, así que nadie queda atrapado en la puerta equivocada.

El reparto **no es cosmético**: el login envía el campo `portal` y el backend rechaza con 403
a quien no corresponda, de modo que un tutor no llega a entrar por la puerta de los niños y
no hace falta expulsarlo después de haber iniciado sesión. La app también recuerda por qué
puerta se entró: al cerrar sesión o al caducar el token, el niño vuelve a `/soy-estudiante` y
no a la pantalla del equipo.

---

## Modelo de datos

```
Course ─┬─< Module ─< Class
        └─< Group

User ─┬─< Group (tutor)
      ├─< Student (cuenta de acceso de la familia)
      └─< Suggestion / Payment / Expense (autor o registrador)

Student ─┬─< StudentGroup >─ Group
         ├─< Attendance >─ GroupProgress >─ Class >─ Module
         └─< Payment
```

### Varios cursos en paralelo

`Course` es el programa completo (Python, Scratch, robótica…). Cada curso tiene su propio
currículo y cada grupo cursa exactamente uno, de modo que los cursos no se mezclan:

- El número de módulo es único **por curso**: cada curso tiene su propio "Módulo 1".
- El avance de un grupo se mide contra las clases de **su** curso. Agregar un curso nuevo no
  altera el porcentaje de los grupos que ya existen.
- En el detalle de un grupo solo aparece el currículo de su curso, y el backend rechaza
  registrar avance o asistencia de una clase que pertenezca a otro.
- Una familia puede tener a su hijo en varios cursos a la vez: el panel muestra un bloque de
  avance por curso.
- Un curso con grupos no se puede eliminar; se archiva (`activo = false`) para conservar el
  historial.

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
| POST   | `/auth/login`               | todos  | Devuelve el token y el usuario. Acepta `portal: "equipo" \| "estudiantes"` |
| GET    | `/auth/me`                  | sesión | Usuario, sus estudiantes o sus grupos|
| POST   | `/auth/change-password`     | sesión | Cambia la propia contraseña          |

### Currículo
| Método | Ruta                                  | Quién  |
| ------ | ------------------------------------- | ------ |
| GET    | `/curriculum/courses`                 | sesión |
| POST   | `/curriculum/courses`                 | admin  |
| PATCH  | `/curriculum/courses/:id`             | admin  |
| DELETE | `/curriculum/courses/:id`             | admin  |
| GET    | `/curriculum/modules?courseId=`       | sesión |
| GET    | `/curriculum/modules/:id`             | sesión |
| POST   | `/curriculum/modules`                 | admin  |
| PATCH  | `/curriculum/modules/:id`             | admin  |
| DELETE | `/curriculum/modules/:id`             | admin  |
| GET    | `/curriculum/classes/:id`             | sesión |
| POST   | `/curriculum/modules/:moduleId/classes` | admin |
| PATCH  | `/curriculum/classes/:id`             | admin  |
| DELETE | `/curriculum/classes/:id`             | admin  |

`GET /curriculum/modules` sin `courseId` devuelve el currículo de todos los cursos.

Borrar un módulo o clase con historial de clases dictadas responde `409`; hay que repetir
la petición con `?force=true` para confirmar. Un curso con grupos asociados nunca se borra:
la API responde `409` y sugiere archivarlo.

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
| GET    | `/health`    | Liveness: 200 mientras el proceso este vivo (sin auth) |
| GET    | `/health/ready` | Readiness: 503 si la base no responde (sin auth)   |

---

## Despliegue en Railway

El backend sirve el build del frontend cuando existe `frontend/dist`, así que el proyecto se
despliega con **un solo servicio web + el plugin de PostgreSQL**. Es la opción recomendada:
una sola URL, sin CORS y sin variables cruzadas entre servicios.

> No crees un servicio aparte para el frontend. Los dos leerían el mismo `railway.json` de la
> raíz y ambos acabarían ejecutando el backend.

### 1. Base de datos

En el proyecto, **+ New → Database → PostgreSQL**. Sin esto el servicio no arranca:
`DATABASE_URL` es obligatoria y el backend falla al iniciar.

### 2. Servicio web

**+ New → GitHub Repo** y elige este repositorio.

- **Root Directory**: déjalo vacío (la raíz del repo). Es un monorepo con workspaces de npm;
  si apuntas a `backend/` el build no encuentra el `package.json` raíz y falla.
- Build y start salen de `railway.json`, no hay que escribirlos a mano:
  - build: `npm run build` — compila el frontend (`prisma generate` corre en el postinstall)
  - start: `npm start` — aplica migraciones, siembra si toca y levanta el servidor
  - healthcheck: `/health`

### 3. Variables del servicio

| Variable              | Valor                                        |
| --------------------- | -------------------------------------------- |
| `DATABASE_URL`        | `${{Postgres.DATABASE_URL}}` (referencia)     |
| `JWT_SECRET`          | una clave larga: `openssl rand -base64 48`    |
| `NODE_ENV`            | `production`                                  |
| `CORS_ORIGINS`        | `*`                                           |
| `VALOR_MENSUALIDAD`   | el valor de la mensualidad, ej. `120000`      |
| `SEED_ON_START`       | `true` **solo para el primer despliegue**     |
| `SEED_DEMO`           | `false`                                       |
| `SEED_ADMIN_EMAIL`    | tu correo de administrador                    |
| `SEED_ADMIN_PASSWORD` | una contraseña que cambiarás al entrar        |

`PORT` lo inyecta Railway solo; no la definas.

`JWT_SECRET` es obligatoria en producción: si falta, el servidor se niega a arrancar en vez de
firmar tokens con una clave por defecto.

### 4. Desplegar

Aplica los cambios. Mira los **Deploy Logs** (no los Build Logs: el build puede pasar y el
arranque fallar igual). En el primer arranque deben mostrar:

```
Applying migration `20260814193606_init`
Applying migration `20260814210000_add_courses`
[bootstrap] SEED_ON_START=true, sembrando la base de datos...
  curso "Python para ninos": 11 modulos, 44 clases
  admin: tu-correo@ejemplo.com
[api] escuchando en http://localhost:8080 (production)
```

### 5. Después del primer arranque

1. Genera el dominio público (**Settings → Networking → Generate Domain**).
2. Entra con las credenciales de `SEED_ADMIN_*` y cámbialas en **Mi cuenta**.
3. Pon `SEED_ON_START=false`. El seed es idempotente y no rompe nada si se repite, pero
   sembrar en cada despliegue es trabajo inútil.

Los despliegues siguientes aplican solas las migraciones nuevas al arrancar.

### Si no puedes entrar: "Email o contraseña incorrectos"

Ese mensaje significa que la base responde y la tabla de usuarios existe, pero la cuenta no
está o la clave no coincide. Casi siempre es una de estas dos:

- **El seed no llegó a correr.** Solo se ejecuta con `SEED_ON_START=true` en el arranque;
  definir `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` por su cuenta no crea ninguna cuenta.
  Mira los Deploy Logs: si dice `SEED_ON_START no esta activo`, ponla en `true` y vuelve a
  desplegar. Al arrancar debe aparecer `admin CREADO: tu-correo@ejemplo.com`.
- **La cuenta ya existía con otra contraseña.** El seed nunca pisa la contraseña de un
  administrador existente, para no revertir en cada despliegue un cambio hecho desde la
  plataforma. Si el log dice `admin YA EXISTIA`, añade `RESET_ADMIN_PASSWORD=true`, despliega,
  entra, y **quita esa variable**.

Cuida también los espacios: al pegar valores en el panel es fácil arrastrar un espacio final.
El seed los recorta y lo avisa en el log, pero el formulario de login no.

### Si el healthcheck falla

`Healthcheck failure` / `1/1 replicas never became healthy` significa que el proceso no llegó
a escuchar: el build salió bien pero el arranque no. Revisa los **Deploy Logs**, donde el
servidor dice qué le falta. Causas habituales:

| En los logs                                      | Qué pasa                                                    |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `faltan variables de entorno obligatorias`       | Falta `DATABASE_URL` o `JWT_SECRET` (ver la tabla de arriba) |
| `Can't reach database server`                    | No hay plugin de PostgreSQL, o `DATABASE_URL` no es la referencia `${{Postgres.DATABASE_URL}}` |
| Nada, el log está vacío                          | El servicio no tiene el repositorio bien enlazado            |

El healthcheck apunta a `/health`, que responde sin tocar la base a propósito: así una base
lenta en el primer arranque no tumba un despliegue por lo demás correcto.

### Alternativa: dos servicios

Si prefieres separar frontend y backend, el frontend necesita build `npm run build -w frontend`
sirviendo `frontend/dist`, la variable `VITE_API_URL` con la URL pública del backend, y
`CORS_ORIGINS` en el backend con el dominio del frontend.

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
| `SEED_ON_START=true`  | Variable que hace que el arranque siembre la base    |
| `npm run db:generate` | Regenera el cliente de Prisma                        |

---

## Estructura

```
backend/
  prisma/
    schema.prisma      modelo de datos
    curriculum.js      los 11 módulos y sus 44 clases del curso de Python
    seed.js            siembra idempotente
  src/
    app.js, server.js  arranque de Express
    config/            variables de entorno validadas
    middleware/        auth, validación (zod) y errores
    routes/            un archivo por área funcional
    services/          cálculos de balance, cartera y avance por curso
frontend/
  src/
    api/               cliente HTTP y manejo del token
    context/           sesión (AuthContext)
    components/        layout, rutas protegidas y UI compartida
    pages/             una vista por sección, diferenciada por rol
```
