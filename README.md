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

| Acción                                 | Admin | Tutor             | Vendedor         | Estudiante/Acudiente |
| -------------------------------------- | :---: | :---------------: | :--------------: | :------------------: |
| Ver currículo                          |  ✅   | ✅ (solo lectura) | ✅ (solo lectura) | ✅ (solo lectura)    |
| Crear y editar cursos                  |  ✅   | ❌                | ❌               | ❌                   |
| Editar módulos y clases                |  ✅   | ❌                | ❌               | ❌                   |
| Gestionar usuarios                     |  ✅   | ❌                | ❌               | ❌                   |
| Gestionar estudiantes y grupos         |  ✅   | ❌                | ❌               | ❌                   |
| Ver estudiantes                        | todos | solo sus grupos   | todos            | solo sus hijos       |
| Registrar avance de clases             |  ✅   | ✅ (sus grupos)   | ❌               | ❌                   |
| Tomar asistencia y dejar observaciones |  ✅   | ✅ (sus grupos)   | ❌               | ❌                   |
| Ver su propio avance y asistencia      |  ✅   | ✅                | —                | ✅                   |
| Enviar sugerencias                     |  ✅   | ✅                | ❌               | ✅                   |
| Responder sugerencias                  |  ✅   | ❌                | ❌               | ❌                   |
| Atender interesados                    |  ✅   | ❌                | ✅               | ❌                   |
| Crear la cuenta de una familia         |  ✅   | ❌                | ✅ (desde el interesado) | ❌            |
| Registrar pagos                        |  ✅   | ❌                | ✅               | ❌                   |
| Balance, gastos y cartera              |  ✅   | ❌                | ❌               | ❌                   |

El control se aplica en el backend (middleware `authorize` + filtros por rol en cada
consulta), no solo en la interfaz: entrar por URL directa a una sección ajena devuelve 403.

### La clase online

Las clases se dictan por videollamada, y la plataforma guarda el enlace para que nadie tenga
que reenviarlo cada semana:

- El admin pone el **enlace de la clase virtual** al crear o editar el grupo (una sala fija de
  Meet o Zoom, la misma todas las semanas).
- El estudiante ve un botón grande **"🎥 Entrar a mi clase"** en su panel, junto al avance de
  ese curso. Si aún no hay enlace, se le explica en vez de dejar un hueco.
- El tutor tiene el mismo botón en su panel y en el detalle del grupo.

El enlace se valida como URL en el formulario y también en el servidor.

### De visitante a estudiante

La raíz `/` es **pública**: presenta los cursos y recoge un teléfono al que llamar. No pide crear
una cuenta, porque una cuenta sin pago confirmado no le sirve a nadie.

```
Visitante deja sus datos en /   →   Lead (NUEVO)
Vendedor llama                  →   Lead (CONTACTADO)
Confirma el pago                →   crea User + Student + acceso al curso, Lead (INSCRITO)
Familia entra por /soy-estudiante y ya ve su curso
```

El paso de conversión crea **la cuenta, la ficha del niño y su acceso al curso en una sola
operación** dentro de una transacción. Es a propósito: los estados a medias (cuenta sin niño,
niño sin cuenta) eran la causa más común de "asigné el curso y la familia no ve nada".

Un interesado se guarda en la tabla `leads`, no en `users`: quien nunca se matricule no ensucia
la lista de cuentas ni puede iniciar sesión.

**El formulario está abierto a internet**, así que tiene tres frenos: validación en el servidor,
un límite de 10 envíos por hora desde la misma IP, y un campo trampa invisible que solo rellenan
los bots — a esos se les responde `201` igual que a una persona, porque decirles que fueron
rechazados solo les enseña a ajustar el siguiente intento.

Lo público **no filtra el currículo**: `/api/public/courses` devuelve nombre, descripción, edad y
cuántos módulos tiene cada curso, nunca sus clases ni su contenido.

El rol **Vendedor** se crea desde *Usuarios → + Nuevo usuario*. Ve Interesados, Estudiantes,
Currículo y Pagos; el balance, los gastos, la cartera y la gestión de usuarios le responden `403`
aunque llame a la API directamente.

### Dos entradas

La plataforma tiene dos pantallas de acceso a la misma cuenta y contraseña:

| Ruta              | Para quién                | Cómo es                                              |
| ----------------- | ------------------------- | ---------------------------------------------------- |
| `/login`          | administradores, tutores y vendedores | Formulario compacto, el de siempre         |
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
      ├─< Lead (vendedor que lo atiende / cuenta creada a partir de él)
      └─< Suggestion / Payment / Expense (autor o registrador)

Lead ──> Course (curso que pidió)

Student ─┬─< StudentGroup >─ Group
         ├─< Attendance >─ GroupProgress >─ Class >─ Module
         └─< Payment
```

### Los pagos habilitan el contenido

Un pago dice **qué compra** y al registrarlo habilita ese contenido de una vez:

| Tipo de pago     | Qué habilita                        |
| ---------------- | ----------------------------------- |
| Mensualidad      | Nada nuevo: renueva lo que ya tiene |
| Curso completo   | Todas las clases del curso          |
| Módulo suelto    | Las clases de ese módulo            |
| Clase suelta     | Solo esa clase                      |

Las clases no compradas aparecen **con candado** en lugar de esconderse, para que la familia
vea qué puede adquirir; su contenido ni siquiera se envía al navegador, porque es justo lo que
se está vendiendo.

**Atrasarse no bloquea nada.** Pasados los días de gracia (`DIAS_GRACIA_PAGO`, 10 por defecto)
el estudiante ve un aviso de pago pendiente y el admin lo ve marcado en cartera, pero conserva
el acceso: dejar a un niño sin material por un pago registrado con retraso hace más daño que
el atraso mismo.

### El currículo son dos páginas: catálogo y plan de clases

Con un solo curso daba igual, pero con varios volcar todos los módulos en una página obligaba a
desplazarse cientos de líneas para llegar al que interesa. Así que **Currículo** se partió en dos:

| Página                | Ruta                   | Qué muestra                                                     |
| --------------------- | ---------------------- | --------------------------------------------------------------- |
| Catálogo              | `/curriculo`           | Una tarjeta por curso: nombre, descripción, cuántos módulos y clases tiene, cuántos grupos, duración y edad. El admin crea, edita y elimina cursos desde aquí. |
| Plan de clases        | `/curriculo/:courseId` | Los módulos de **ese** curso con sus clases desplegables. El admin crea módulos y clases, y edita el curso, sin salir de la página. |

Cada curso tiene URL propia, así que se puede guardar en favoritos o compartir con un tutor. Pedir
por URL un curso al que no se tiene acceso muestra "Curso no encontrado" con un enlace de vuelta al
catálogo: la API responde `404`, igual que para un curso inexistente, para no delatar que existe.

### Quién ve qué currículo

El currículo no es público para cualquier usuario con sesión: un estudiante solo ve los cursos
a los que tiene acceso.

- **`StudentCourse`** guarda los cursos que el admin le habilita a cada niño (los que pagó).
- El acceso efectivo es esa lista **unida** a los cursos de los grupos donde está inscrito, para
  que nunca ocurra el caso absurdo de estar en un grupo y no poder abrir su propio currículo.
- El permiso vive en el **niño**, no en la cuenta: si una familia tiene a un hijo en Python y a
  otro en Scratch, cada uno ve el suyo.
- Los cursos sin acceso **no aparecen**, y pedirlos por API responde `404` en vez de `403`, para
  no delatar que existen.
- **Admin y tutores ven el catálogo completo**: son el equipo y necesitan preparar las clases.

Al crear una cuenta con rol Estudiante, el formulario pide en el mismo paso el nombre del niño y
al menos un curso; sin curso no deja guardar. Después se añaden o quitan desde **Usuarios →
Editar** (cursos de cada hijo) o desde **Estudiantes → Editar**.

#### El niño y la cuenta son dos registros, y hay que unirlos

Los cursos se guardan en el **niño** (`Student`), pero se ven entrando con la **cuenta** (`User`).
Si los dos existen pero no están enlazados, todo parece correcto desde Estudiantes y la familia no
ve nada al entrar. Para que no pase desapercibido:

- La pantalla de **Inicio** del admin abre con un bloque **"Cosas por revisar"** que cuenta los
  niños sin cuenta, las cuentas sin niño y los niños sin curso, con un botón a la pantalla donde
  se arregla cada uno. Si no hay nada pendiente, el bloque no aparece.
- En **Estudiantes**, un niño sin cuenta sale marcado en ámbar como **"Sin cuenta · vincular"**;
  el botón abre su ficha para elegir la cuenta sin salir de la lista. El formulario avisa
  mientras no se elija una.
- En **Usuarios**, una cuenta sin niño sale marcada como **"Sin estudiante"**.
- Al editar una cuenta sin niño se ofrece **vincular un niño ya registrado** (opción por defecto
  si hay alguno suelto, porque conserva sus cursos, grupos y asistencia) o crear uno nuevo.

Crear el usuario desde **Usuarios → + Nuevo usuario** con rol Estudiante evita el problema de
raíz: pide el nombre del niño y su curso en el mismo paso, y los deja enlazados.

#### Habilitar un curso y asignar un grupo son dos cosas distintas

- **Habilitar el curso** le da al niño el material: aparece en su Currículo y puede leer el plan
  de clases completo.
- **Asignar un grupo** le pone horario, tutor, enlace de videollamada y avance.

Lo normal es habilitar el curso primero y meter al niño en un grupo cuando haya cupo, así que el
panel de Inicio muestra los cursos habilitados aunque todavía no tengan grupo, con una nota de que
falta asignarlo y un enlace al plan de clases. La ficha del niño (**Estudiantes → ver detalle**)
separa las dos cosas en dos tarjetas: "Cursos habilitados" y "Grupos".

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
| GET    | `/curriculum/courses`                 | sesión (el estudiante solo ve los suyos) |
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
| POST   | `/users`            | admin  | Rol `ESTUDIANTE` exige `estudiante` con `courseIds` |
| PATCH  | `/users/:id`        | admin  |                                           |
| DELETE | `/users/:id`        | admin  | Baja lógica                               |
| GET    | `/students`         | sesión | Alcance según rol                         |
| GET    | `/students/:id`     | sesión | Incluye resumen de asistencia y sus cursos |
| POST   | `/students`         | admin  |                                           |
| PATCH  | `/students/:id`     | admin  | `courseIds` reemplaza sus accesos          |
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

> **Si borras y vuelves a crear la base**, el backend queda apuntando al servicio anterior y
> `DATABASE_URL` se resuelve como cadena vacía. El arranque lo detecta y lo explica en el log;
> la solución está en [Si borraste y recreaste la base de datos](#si-borraste-y-recreaste-la-base-de-datos).

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

### Borrar los datos de ejemplo

El seed crea tutores, familias y pagos de muestra para que la plataforma no se vea vacía. Para
dejar solo información real:

```bash
npm run db:limpiar                              # simula: lista qué borraría
npm run limpiar -w backend -- --confirmar       # borra los datos de ejemplo
npm run limpiar -w backend -- --todo --confirmar  # borra TODO lo operativo
```

En Railway, donde no hay consola, se hace con variables: `LIMPIAR_AL_ARRANCAR=demo` (o `todo`)
más `LIMPIAR_CONFIRMAR=true`. Sin la segunda solo escribe en el log lo que borraría. Quita
ambas después de usarlas.

**Nunca borra el currículo ni las cuentas de administrador.** Los cursos que hayas creado tú se
eliminan desde Currículo → Eliminar curso.

### Si borraste y recreaste la base de datos

El log muestra un error de Prisma que parece del esquema:

```
error: Error validating datasource `db`: You must provide a nonempty URL.
The environment variable `DATABASE_URL` resolved to an empty string.
  -->  prisma/schema.prisma:10
```

El esquema no tiene nada malo. Al borrar la base, el backend conservó la **referencia** al
servicio que ya no existe, y Railway la resuelve como cadena vacía en lugar de avisar. Es la
misma razón por la que no aparece la flecha entre los dos servicios en el lienzo: sin
referencia válida no hay flecha que dibujar.

1. Servicio del **backend** → pestaña **Variables**.
2. Borra la `DATABASE_URL` que tenga.
3. **Add Variable Reference** → servicio Postgres actual → `DATABASE_URL`. Tiene que ser una
   referencia, no un texto pegado a mano: al recrear la base, el nombre del servicio suele
   cambiar (`Postgres`, `Postgres-a1b2`…) y una referencia vieja apunta a la nada.
4. Redespliega. **Si la flecha no aparece, la referencia no quedó bien**; es la forma más rápida
   de comprobarlo sin leer logs.

El arranque comprueba `DATABASE_URL` antes de lanzar Prisma (`prisma/preflight.js`) y, si falta
o llega vacía, imprime estos mismos pasos en lugar del error de esquema.

**La base nueva está vacía**, así que también hay que volver a sembrarla: `SEED_ON_START=true`
con `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`, y `SEED_DEMO=false` si no quieres datos de
ejemplo. Las cuentas, los niños y los pagos de la base anterior **no se recuperan**.

### Una cuenta de estudiante que "no ve nada"

Si al entrar una familia solo ve *"Todavía no hay estudiantes vinculados a tu cuenta"*, la
cuenta existe pero no tiene ningún niño asociado — los datos del curso cuelgan del niño, no de
la cuenta. Pasa con cuentas creadas antes de que el alta exigiera los datos del estudiante, o
si se cambió el rol de un usuario a Estudiante.

En **Usuarios** esas cuentas salen marcadas con **"Sin estudiante"**; al pulsar *Editar* se
puede crear el niño y asignarle sus cursos sin salir del formulario.

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

### Saber qué versión está desplegada

`GET /api` y `GET /health` devuelven el commit que está corriendo:

```json
{ "despliegue": { "commit": "a687fa9", "rama": "main" } }
```

Si ese commit no coincide con el último de `main`, el despliegue no llegó a correr. Revisa en
Railway:

1. **Deployments**: ¿hay un despliegue para ese commit? Si el último es anterior, el
   auto-deploy no se disparó.
2. **Settings → Source**: ¿qué rama observa el servicio? Si no es `main`, los merges a `main`
   no lo despiertan.
3. Si el auto-deploy está apagado, usa **Deploy** para lanzarlo a mano.

Con el commit correcto pero la interfaz vieja, es caché del navegador: recarga forzada
(Ctrl+Shift+R).

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
| `npm run db:limpiar`  | Simula el borrado de los datos de ejemplo            |
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
