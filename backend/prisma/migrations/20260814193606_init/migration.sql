-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TUTOR', 'ESTUDIANTE');

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('PENDIENTE', 'DICTADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('NUEVA', 'LEIDA', 'ATENDIDA');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'NEQUI', 'DAVIPLATA', 'OTRO');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('PLATAFORMA', 'MATERIALES', 'PAGO_TUTORES', 'MARKETING', 'ADMINISTRATIVO', 'OTRO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Role" NOT NULL DEFAULT 'ESTUDIANTE',
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "acudienteNombre" TEXT,
    "acudienteTelefono" TEXT,
    "acudienteEmail" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "diaSemana" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "cupoMaximo" INTEGER,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tutorId" TEXT,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_groups" (
    "id" TEXT NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVO',
    "studentId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "student_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "numeroClase" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "conceptosClave" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duracionMinutos" INTEGER NOT NULL DEFAULT 60,
    "recursosUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_progress" (
    "id" TEXT NOT NULL,
    "estado" "ClassStatus" NOT NULL DEFAULT 'PENDIENTE',
    "fechaDictada" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groupId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,

    CONSTRAINT "group_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "asistio" BOOLEAN NOT NULL DEFAULT false,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groupProgressId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestions" (
    "id" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "estado" "SuggestionStatus" NOT NULL DEFAULT 'NUEVA',
    "respuesta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondidaEn" TIMESTAMP(3),
    "userId" TEXT,
    "respondidaPorId" TEXT,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "metodoPago" "PaymentMethod" NOT NULL DEFAULT 'TRANSFERENCIA',
    "periodoCubierto" TEXT NOT NULL,
    "concepto" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "registradoPorId" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "categoria" "ExpenseCategory" NOT NULL DEFAULT 'OTRO',
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "proveedor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "registradoPorId" TEXT,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_rol_idx" ON "users"("rol");

-- CreateIndex
CREATE INDEX "students_userId_idx" ON "students"("userId");

-- CreateIndex
CREATE INDEX "students_activo_idx" ON "students"("activo");

-- CreateIndex
CREATE INDEX "groups_tutorId_idx" ON "groups"("tutorId");

-- CreateIndex
CREATE INDEX "student_groups_groupId_idx" ON "student_groups"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "student_groups_studentId_groupId_key" ON "student_groups"("studentId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "modules_numero_key" ON "modules"("numero");

-- CreateIndex
CREATE INDEX "modules_orden_idx" ON "modules"("orden");

-- CreateIndex
CREATE INDEX "classes_moduleId_idx" ON "classes"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "classes_moduleId_numeroClase_key" ON "classes"("moduleId", "numeroClase");

-- CreateIndex
CREATE INDEX "group_progress_groupId_idx" ON "group_progress"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "group_progress_groupId_classId_key" ON "group_progress"("groupId", "classId");

-- CreateIndex
CREATE INDEX "attendance_studentId_idx" ON "attendance"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_groupProgressId_studentId_key" ON "attendance"("groupProgressId", "studentId");

-- CreateIndex
CREATE INDEX "suggestions_estado_idx" ON "suggestions"("estado");

-- CreateIndex
CREATE INDEX "suggestions_userId_idx" ON "suggestions"("userId");

-- CreateIndex
CREATE INDEX "payments_studentId_periodoCubierto_idx" ON "payments"("studentId", "periodoCubierto");

-- CreateIndex
CREATE INDEX "payments_fecha_idx" ON "payments"("fecha");

-- CreateIndex
CREATE INDEX "expenses_fecha_idx" ON "expenses"("fecha");

-- CreateIndex
CREATE INDEX "expenses_categoria_idx" ON "expenses"("categoria");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_progress" ADD CONSTRAINT "group_progress_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_progress" ADD CONSTRAINT "group_progress_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_groupProgressId_fkey" FOREIGN KEY ("groupProgressId") REFERENCES "group_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_respondidaPorId_fkey" FOREIGN KEY ("respondidaPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
