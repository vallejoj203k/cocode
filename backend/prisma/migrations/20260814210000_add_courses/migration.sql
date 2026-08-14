-- Introduce el modelo de Curso: cada grupo cursa un curso y cada curso tiene
-- su propio curriculo. Los modulos y grupos que ya existen se asignan al curso
-- "Python para ninos" para no perder historial.

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracionMeses" INTEGER,
    "edadSugerida" TEXT,
    "color" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "courses_orden_idx" ON "courses"("orden");

-- Curso por defecto que hereda todo el curriculo y los grupos existentes.
INSERT INTO "courses" ("id", "nombre", "descripcion", "duracionMeses", "edadSugerida", "activo", "orden", "createdAt", "updatedAt")
VALUES (
    'curso-python-kids',
    'Python para ninos',
    'Curso de Python desde cero: 11 modulos de 4 clases, una clase semanal de una hora.',
    11,
    '8 a 10 anos',
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- AlterTable: modules.courseId (se agrega nullable, se rellena y se fija NOT NULL)
ALTER TABLE "modules" ADD COLUMN "courseId" TEXT;
UPDATE "modules" SET "courseId" = 'curso-python-kids' WHERE "courseId" IS NULL;
ALTER TABLE "modules" ALTER COLUMN "courseId" SET NOT NULL;

-- AlterTable: groups.courseId
ALTER TABLE "groups" ADD COLUMN "courseId" TEXT;
UPDATE "groups" SET "courseId" = 'curso-python-kids' WHERE "courseId" IS NULL;
ALTER TABLE "groups" ALTER COLUMN "courseId" SET NOT NULL;

-- La numeracion de modulos pasa a ser unica por curso, no global.
DROP INDEX "modules_numero_key";
DROP INDEX "modules_orden_idx";

-- CreateIndex
CREATE UNIQUE INDEX "modules_courseId_numero_key" ON "modules"("courseId", "numero");
CREATE INDEX "modules_courseId_orden_idx" ON "modules"("courseId", "orden");
CREATE INDEX "groups_courseId_idx" ON "groups"("courseId");

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "groups" ADD CONSTRAINT "groups_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
