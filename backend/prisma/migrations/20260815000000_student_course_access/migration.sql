-- Acceso de un estudiante al curriculo de un curso. Hasta ahora cualquier
-- usuario autenticado podia leer el curriculo completo de todos los cursos.

-- CreateTable
CREATE TABLE "student_courses" (
    "id" TEXT NOT NULL,
    "concedidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" TEXT,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "concedidoPorId" TEXT,

    CONSTRAINT "student_courses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_courses_studentId_courseId_key" ON "student_courses"("studentId", "courseId");
CREATE INDEX "student_courses_courseId_idx" ON "student_courses"("courseId");

-- AddForeignKey
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_concedidoPorId_fkey" FOREIGN KEY ("concedidoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Relleno: a cada estudiante ya inscrito se le concede el curso de sus grupos.
-- Sin esto, al desplegar los estudiantes actuales se quedarian sin ver nada.
INSERT INTO "student_courses" ("id", "studentId", "courseId", "concedidoEn", "nota")
SELECT
    gen_random_uuid()::text,
    sg."studentId",
    g."courseId",
    CURRENT_TIMESTAMP,
    'Concedido automaticamente al activar el control de acceso por curso'
FROM "student_groups" sg
JOIN "groups" g ON g."id" = sg."groupId"
GROUP BY sg."studentId", g."courseId";
