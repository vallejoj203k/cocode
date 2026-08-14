# Contexto del proyecto — Plataforma Curso de Python para Niños

## 1. Descripción general

Plataforma web para gestionar un curso de Python desde cero dirigido a niños de 8 a 10 años.

- **Duración del curso:** 11 meses
- **Frecuencia:** 1 clase por semana, 1 hora cada clase
- **Estructura:** el curso se organiza en **módulos**, cada módulo tiene **4 clases**
- **Objetivo de la plataforma:** centralizar la información del curso, gestionar usuarios por rol, permitir seguimiento del avance de cada estudiante, recibir sugerencias, y llevar el control financiero del negocio

## 2. Stack tecnológico

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL + Prisma ORM
- **Autenticación:** JWT + middleware de autorización por rol
- **Deploy:** Railway (backend, frontend y base de datos Postgres en el mismo proyecto)

## 3. Roles del sistema

### Admin
- Crear, editar y eliminar módulos y clases del currículo
- Gestionar usuarios: crear/editar tutores, aprobar o dar de baja estudiantes
- Ver todo el avance de todos los estudiantes y grupos
- Acceso completo al módulo financiero (ingresos, gastos, balances)
- Ver y gestionar el buzón de sugerencias
- Crear y administrar grupos/cohortes (por si hay varios grupos de estudiantes en paralelo)

### Tutor
- Ver el contenido del currículo (módulos y clases) — solo lectura
- Marcar asistencia de sus estudiantes por clase
- Marcar avance/estado de cada clase dictada (dictada, pendiente, etc.)
- Dejar notas u observaciones por estudiante (comportamiento, progreso, dificultades)
- Ver el listado de estudiantes de sus grupos asignados
- NO tiene acceso al módulo financiero
- NO puede editar el currículo ni gestionar usuarios

### Estudiante (o padre/acudiente, según se defina el acceso)
- Ver el contenido del módulo/clase actual y anteriores (avance del curso)
- Ver su propia asistencia y progreso
- Enviar sugerencias a través del buzón
- NO tiene acceso a información financiera ni a otros estudiantes

> **Nota de diseño a decidir:** dado que son niños de 8-10 años, es muy probable que quien realmente use la cuenta "Estudiante" sea el padre/acudiente. Definir si el rol se llama "Estudiante" o si se agrega un sub-rol "Acudiente" con el mismo nivel de permisos. Esto afecta el modelo de datos (posiblemente un usuario "Acudiente" vinculado a uno o varios "Estudiantes").

## 4. Módulos funcionales de la plataforma

### 4.1 Gestión de currículo
- CRUD de Módulos (nombre, objetivo, número de módulo, orden)
- CRUD de Clases dentro de cada módulo (número de clase, objetivo, contenido/plan de la clase, duración, conceptos clave)
- Relación: 1 módulo → 4 clases (fijo, pero el modelo de datos no debería forzar ese número por si se quiere flexibilizar a futuro)

### 4.2 Gestión de usuarios y roles
- CRUD de usuarios (Admin, Tutor, Estudiante)
- Asignación de estudiantes a grupos/cohortes
- Asignación de tutores a grupos

### 4.3 Grupos / Cohortes
- Un grupo agrupa a varios estudiantes que llevan el curso juntos (mismo horario semanal)
- Un grupo tiene un tutor asignado
- Un grupo avanza módulo por módulo, clase por clase

### 4.4 Asistencia y avance
- Por cada clase dictada a un grupo: registrar qué estudiantes asistieron
- Estado de avance del grupo (en qué módulo/clase va)
- Notas del tutor por estudiante y por clase (opcional)

### 4.5 Buzón de sugerencias
- Formulario simple donde estudiantes (o acudientes) dejan sugerencias/comentarios
- Admin puede ver, marcar como leída/atendida, y responder (opcional)
- Campos sugeridos: usuario que envía, fecha, mensaje, estado (nueva/leída/atendida)

### 4.6 Módulo financiero (solo Admin)
- **Ingresos:** registro de pagos de matrícula/mensualidades por estudiante (fecha, monto, método de pago, estudiante asociado, mes/periodo que cubre)
- **Gastos:** registro de gastos operativos (plataforma, materiales, pago a tutores, etc.) con categoría, fecha, monto, descripción
- **Balance:** vista de ingresos vs gastos por periodo (mensual/anual)
- **Estado de cartera:** qué estudiantes están al día y cuáles tienen pagos pendientes
- Posible export a Excel/CSV para llevar a contabilidad

## 5. Modelo de datos (borrador inicial)

```
User
- id, nombre, email, password_hash, rol (ADMIN | TUTOR | ESTUDIANTE), created_at

Group (Cohorte)
- id, nombre, tutor_id (FK -> User), dia_semana, hora, fecha_inicio

StudentGroup (relación estudiante-grupo)
- id, student_id (FK -> User), group_id (FK -> Group), fecha_ingreso

Module
- id, numero, nombre, objetivo, orden

Class
- id, module_id (FK -> Module), numero_clase, nombre, objetivo, contenido, conceptos_clave

GroupProgress
- id, group_id (FK -> Group), class_id (FK -> Class), fecha_dictada, estado (pendiente|dictada)

Attendance
- id, group_progress_id (FK -> GroupProgress), student_id (FK -> User), asistio (bool), nota

Suggestion
- id, user_id (FK -> User), mensaje, fecha, estado (nueva|leida|atendida), respuesta

Payment (Ingreso)
- id, student_id (FK -> User), monto, fecha, metodo_pago, periodo_cubierto, nota

Expense (Gasto)
- id, categoria, descripcion, monto, fecha
```

## 6. Instrucción para Claude Code

Con este contexto, construir la plataforma completa:
1. Setup inicial del monorepo (backend Express + Prisma, frontend Vite + React + Tailwind)
2. Modelo de datos en Prisma según el borrador de la sección 5 (ajustar si se detectan mejoras)
3. Autenticación JWT con middleware de roles (Admin / Tutor / Estudiante)
4. Endpoints REST para cada módulo funcional (sección 4)
5. Frontend con vistas diferenciadas según rol (dashboard Admin, dashboard Tutor, dashboard Estudiante)
6. Configuración para despliegue en Railway (variables de entorno, build scripts)
