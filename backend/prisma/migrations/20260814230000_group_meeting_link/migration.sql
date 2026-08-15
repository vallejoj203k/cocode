-- Enlace de la videollamada semanal del grupo, para que el estudiante entre a
-- clase desde la plataforma sin depender de que alguien reenvie el link.
ALTER TABLE "groups" ADD COLUMN "enlaceReunion" TEXT;
