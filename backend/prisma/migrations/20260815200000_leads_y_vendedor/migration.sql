-- Rol de ventas: atiende a los interesados y les crea la cuenta al confirmar el
-- pago. Se anade al enum sin tocar los valores existentes.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'VENDEDOR' BEFORE 'ESTUDIANTE';

-- Ciclo de vida de un interesado.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadEstado') THEN
    CREATE TYPE "LeadEstado" AS ENUM ('NUEVO', 'CONTACTADO', 'INSCRITO', 'DESCARTADO');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "leads" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "nombreEstudiante" TEXT,
    "edadEstudiante" INTEGER,
    "mensaje" TEXT,
    "estado" "LeadEstado" NOT NULL DEFAULT 'NUEVO',
    "notas" TEXT,
    "contactadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT,
    "atendidoPorId" TEXT,
    "userId" TEXT,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "leads_estado_idx" ON "leads"("estado");
CREATE INDEX IF NOT EXISTS "leads_createdAt_idx" ON "leads"("createdAt");

-- Borrar un curso, un vendedor o una cuenta no debe borrar el historial de
-- interesados: se deja el campo en NULL.
ALTER TABLE "leads"
  ADD CONSTRAINT "leads_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_atendidoPorId_fkey"
  FOREIGN KEY ("atendidoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
