import { Router } from 'express';
import { env } from '../config/env.js';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import studentsRoutes from './students.routes.js';
import groupsRoutes from './groups.routes.js';
import curriculumRoutes from './curriculum.routes.js';
import suggestionsRoutes from './suggestions.routes.js';
import financeRoutes from './finance.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    nombre: 'API Plataforma Curso de Python para Ninos',
    version: '1.0.0',
    // Commit desplegado: si no coincide con el ultimo de main, el deploy no corrio.
    despliegue: env.version,
    recursos: [
      '/api/auth',
      '/api/users',
      '/api/students',
      '/api/groups',
      '/api/curriculum',
      '/api/suggestions',
      '/api/finance',
      '/api/dashboard',
    ],
  });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/students', studentsRoutes);
router.use('/groups', groupsRoutes);
router.use('/curriculum', curriculumRoutes);
router.use('/suggestions', suggestionsRoutes);
router.use('/finance', financeRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
