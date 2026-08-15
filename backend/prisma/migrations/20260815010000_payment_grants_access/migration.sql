-- Los pagos pasan a decir QUE compran (curso completo, modulo o clase suelta) y
-- conceden ese acceso automaticamente. El acceso deja de ser solo por curso.

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('MENSUALIDAD', 'CURSO_COMPLETO', 'MODULO', 'CLASE');

-- Payment: que compra y para que curso/modulo/clase
ALTER TABLE "payments" ADD COLUMN "tipo" "PaymentType" NOT NULL DEFAULT 'MENSUALIDAD';
ALTER TABLE "payments" ADD COLUMN "courseId" TEXT;
ALTER TABLE "payments" ADD COLUMN "moduleId" TEXT;
ALTER TABLE "payments" ADD COLUMN "classId" TEXT;

-- El periodo solo aplica a la mensualidad: una clase suelta no se renueva.
ALTER TABLE "payments" ALTER COLUMN "periodoCubierto" DROP NOT NULL;

ALTER TABLE "payments" ADD CONSTRAINT "payments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- El acceso se generaliza a tres niveles. Se renombra la tabla conservando las
-- filas: los accesos por curso que ya existen siguen valiendo tal cual.
ALTER TABLE "student_courses" RENAME TO "student_access";
ALTER TABLE "student_access" RENAME CONSTRAINT "student_courses_pkey" TO "student_access_pkey";
ALTER TABLE "student_access" RENAME CONSTRAINT "student_courses_studentId_fkey" TO "student_access_studentId_fkey";
ALTER TABLE "student_access" RENAME CONSTRAINT "student_courses_courseId_fkey" TO "student_access_courseId_fkey";
ALTER TABLE "student_access" RENAME CONSTRAINT "student_courses_concedidoPorId_fkey" TO "student_access_concedidoPorId_fkey";
ALTER INDEX "student_courses_studentId_courseId_key" RENAME TO "student_access_studentId_courseId_key";
DROP INDEX "student_courses_courseId_idx";

ALTER TABLE "student_access" ALTER COLUMN "courseId" DROP NOT NULL;
ALTER TABLE "student_access" ADD COLUMN "moduleId" TEXT;
ALTER TABLE "student_access" ADD COLUMN "classId" TEXT;
ALTER TABLE "student_access" ADD COLUMN "origenPagoId" TEXT;

CREATE UNIQUE INDEX "student_access_studentId_moduleId_key" ON "student_access"("studentId", "moduleId");
CREATE UNIQUE INDEX "student_access_studentId_classId_key" ON "student_access"("studentId", "classId");
CREATE INDEX "student_access_studentId_idx" ON "student_access"("studentId");

ALTER TABLE "student_access" ADD CONSTRAINT "student_access_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_access" ADD CONSTRAINT "student_access_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_access" ADD CONSTRAINT "student_access_origenPagoId_fkey" FOREIGN KEY ("origenPagoId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Exactamente uno de los tres niveles debe estar lleno.
ALTER TABLE "student_access" ADD CONSTRAINT "student_access_un_solo_nivel"
  CHECK (
    (CASE WHEN "courseId" IS NULL THEN 0 ELSE 1 END)
  + (CASE WHEN "moduleId" IS NULL THEN 0 ELSE 1 END)
  + (CASE WHEN "classId"  IS NULL THEN 0 ELSE 1 END) = 1
  );
