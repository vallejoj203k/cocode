import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { curriculum } from './curriculum.js';

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? 'admin@pythonkids.com').toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123*';
// Los datos de ejemplo se pueden desactivar con SEED_DEMO=false (util en produccion).
const CON_DEMO = process.env.SEED_DEMO !== 'false';

const hash = (plain) => bcrypt.hash(plain, 10);
const periodo = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

/** Crea o actualiza los 11 modulos con sus 4 clases. */
async function seedCurriculum() {
  for (const modulo of curriculum) {
    const registro = await prisma.module.upsert({
      where: { numero: modulo.numero },
      update: {
        nombre: modulo.nombre,
        objetivo: modulo.objetivo,
        descripcion: modulo.descripcion,
        orden: modulo.numero,
      },
      create: {
        numero: modulo.numero,
        nombre: modulo.nombre,
        objetivo: modulo.objetivo,
        descripcion: modulo.descripcion,
        orden: modulo.numero,
      },
    });

    for (const clase of modulo.clases) {
      await prisma.class.upsert({
        where: { moduleId_numeroClase: { moduleId: registro.id, numeroClase: clase.numeroClase } },
        update: {
          nombre: clase.nombre,
          objetivo: clase.objetivo,
          contenido: clase.contenido,
          conceptosClave: clase.conceptosClave,
        },
        create: {
          moduleId: registro.id,
          numeroClase: clase.numeroClase,
          nombre: clase.nombre,
          objetivo: clase.objetivo,
          contenido: clase.contenido,
          conceptosClave: clase.conceptosClave,
        },
      });
    }
  }

  const [modulos, clases] = await Promise.all([prisma.module.count(), prisma.class.count()]);
  console.log(`  curriculo: ${modulos} modulos, ${clases} clases`);
}

async function seedAdmin() {
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      nombre: 'Administrador',
      email: ADMIN_EMAIL,
      passwordHash: await hash(ADMIN_PASSWORD),
      rol: 'ADMIN',
    },
  });
  console.log(`  admin: ${admin.email}`);
  return admin;
}

async function crearUsuario({ nombre, email, rol, telefono }) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { nombre, email, rol, telefono, passwordHash: await hash('Demo1234*') },
  });
}

async function seedDemo(admin) {
  // --- Tutores ---
  const [tutorAna, tutorCarlos] = await Promise.all([
    crearUsuario({ nombre: 'Ana Martinez', email: 'ana.tutora@pythonkids.com', rol: 'TUTOR', telefono: '3001112233' }),
    crearUsuario({ nombre: 'Carlos Ruiz', email: 'carlos.tutor@pythonkids.com', rol: 'TUTOR', telefono: '3004445566' }),
  ]);

  // --- Cuentas de acudientes (rol ESTUDIANTE) ---
  const familias = [
    { nombre: 'Familia Gomez', email: 'familia.gomez@correo.com', telefono: '3011234567' },
    { nombre: 'Familia Perez', email: 'familia.perez@correo.com', telefono: '3019876543' },
    { nombre: 'Familia Lopez', email: 'familia.lopez@correo.com', telefono: '3015554433' },
  ];
  const cuentas = {};
  for (const f of familias) {
    cuentas[f.email] = await crearUsuario({ ...f, rol: 'ESTUDIANTE' });
  }

  // --- Estudiantes ---
  const estudiantesDemo = [
    { nombre: 'Sofia', apellido: 'Gomez', edad: 9, cuenta: 'familia.gomez@correo.com', acudiente: 'Marta Gomez' },
    { nombre: 'Mateo', apellido: 'Gomez', edad: 8, cuenta: 'familia.gomez@correo.com', acudiente: 'Marta Gomez' },
    { nombre: 'Valentina', apellido: 'Perez', edad: 10, cuenta: 'familia.perez@correo.com', acudiente: 'Luis Perez' },
    { nombre: 'Samuel', apellido: 'Lopez', edad: 9, cuenta: 'familia.lopez@correo.com', acudiente: 'Diana Lopez' },
    { nombre: 'Isabella', apellido: 'Torres', edad: 8, cuenta: null, acudiente: 'Andrea Torres' },
    { nombre: 'Tomas', apellido: 'Rojas', edad: 10, cuenta: null, acudiente: 'Jorge Rojas' },
  ];

  const estudiantes = [];
  for (const e of estudiantesDemo) {
    const existente = await prisma.student.findFirst({
      where: { nombre: e.nombre, apellido: e.apellido },
    });
    const data = {
      nombre: e.nombre,
      apellido: e.apellido,
      fechaNacimiento: new Date(Date.UTC(new Date().getUTCFullYear() - e.edad, 4, 15)),
      acudienteNombre: e.acudiente,
      acudienteTelefono: '30' + Math.floor(10000000 + Math.random() * 89999999),
      userId: e.cuenta ? cuentas[e.cuenta].id : null,
    };
    estudiantes.push(
      existente
        ? await prisma.student.update({ where: { id: existente.id }, data })
        : await prisma.student.create({ data }),
    );
  }

  // --- Grupos ---
  const inicio = new Date();
  inicio.setUTCMonth(inicio.getUTCMonth() - 2);

  async function crearGrupo({ nombre, tutorId, diaSemana, hora }) {
    const existente = await prisma.group.findFirst({ where: { nombre } });
    const data = { nombre, tutorId, diaSemana, hora, fechaInicio: inicio, cupoMaximo: 8 };
    return existente
      ? prisma.group.update({ where: { id: existente.id }, data })
      : prisma.group.create({ data });
  }

  const grupoA = await crearGrupo({
    nombre: 'Grupo Serpientes',
    tutorId: tutorAna.id,
    diaSemana: 'SABADO',
    hora: '09:00',
  });
  const grupoB = await crearGrupo({
    nombre: 'Grupo Pitones',
    tutorId: tutorCarlos.id,
    diaSemana: 'MIERCOLES',
    hora: '16:00',
  });

  const reparto = [
    [estudiantes[0], grupoA],
    [estudiantes[1], grupoA],
    [estudiantes[2], grupoA],
    [estudiantes[3], grupoB],
    [estudiantes[4], grupoB],
    [estudiantes[5], grupoB],
  ];
  for (const [student, group] of reparto) {
    await prisma.studentGroup.upsert({
      where: { studentId_groupId: { studentId: student.id, groupId: group.id } },
      update: { estado: 'ACTIVO' },
      create: { studentId: student.id, groupId: group.id, fechaIngreso: inicio },
    });
  }

  // --- Avance y asistencia: el grupo A lleva 6 clases y el B lleva 4 ---
  const clasesOrdenadas = await prisma.class.findMany({
    orderBy: [{ module: { orden: 'asc' } }, { numeroClase: 'asc' }],
  });

  async function dictarClases(group, cantidad) {
    const inscritos = await prisma.studentGroup.findMany({
      where: { groupId: group.id, estado: 'ACTIVO' },
    });

    for (let i = 0; i < cantidad; i += 1) {
      const clase = clasesOrdenadas[i];
      const fecha = new Date(inicio);
      fecha.setUTCDate(fecha.getUTCDate() + i * 7);

      const progreso = await prisma.groupProgress.upsert({
        where: { groupId_classId: { groupId: group.id, classId: clase.id } },
        update: { estado: 'DICTADA', fechaDictada: fecha },
        create: { groupId: group.id, classId: clase.id, estado: 'DICTADA', fechaDictada: fecha },
      });

      for (const inscripcion of inscritos) {
        // Asistencia alta pero no perfecta, para que los reportes tengan datos reales.
        const asistio = Math.random() > 0.12;
        await prisma.attendance.upsert({
          where: {
            groupProgressId_studentId: {
              groupProgressId: progreso.id,
              studentId: inscripcion.studentId,
            },
          },
          update: { asistio },
          create: {
            groupProgressId: progreso.id,
            studentId: inscripcion.studentId,
            asistio,
            nota: asistio ? null : 'No asistio',
          },
        });
      }
    }
  }

  await dictarClases(grupoA, 6);
  await dictarClases(grupoB, 4);

  // --- Sugerencias ---
  if ((await prisma.suggestion.count()) === 0) {
    await prisma.suggestion.createMany({
      data: [
        {
          userId: cuentas['familia.gomez@correo.com'].id,
          mensaje: 'A Sofia le encantaria que hubiera mas ejercicios con dibujos de la tortuga.',
          estado: 'NUEVA',
        },
        {
          userId: cuentas['familia.perez@correo.com'].id,
          mensaje: 'Seria util recibir un resumen por correo de lo que se vio en cada clase.',
          estado: 'LEIDA',
        },
        {
          userId: cuentas['familia.lopez@correo.com'].id,
          mensaje: 'Gracias por el curso, Samuel ya nos programo una calculadora en casa.',
          estado: 'ATENDIDA',
          respuesta: 'Muchas gracias por contarnos! Nos alegra mucho.',
          respondidaEn: new Date(),
          respondidaPorId: admin.id,
        },
      ],
    });
  }

  // --- Finanzas: 3 meses de pagos y gastos ---
  if ((await prisma.payment.count()) === 0) {
    const MENSUALIDAD = 120000;
    const hoy = new Date();

    for (let atras = 2; atras >= 0; atras -= 1) {
      const mes = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - atras, 5));
      const periodoMes = periodo(mes);

      for (const [indice, student] of estudiantes.entries()) {
        // El mes en curso deja dos estudiantes pendientes, para ver la cartera.
        if (atras === 0 && indice >= estudiantes.length - 2) continue;
        await prisma.payment.create({
          data: {
            studentId: student.id,
            monto: MENSUALIDAD,
            fecha: mes,
            metodoPago: indice % 2 === 0 ? 'TRANSFERENCIA' : 'NEQUI',
            periodoCubierto: periodoMes,
            concepto: `Mensualidad ${periodoMes}`,
            registradoPorId: admin.id,
          },
        });
      }

      await prisma.expense.createMany({
        data: [
          {
            categoria: 'PAGO_TUTORES',
            descripcion: `Honorarios tutores ${periodoMes}`,
            monto: 320000,
            fecha: mes,
            registradoPorId: admin.id,
          },
          {
            categoria: 'PLATAFORMA',
            descripcion: 'Hosting y dominio',
            monto: 45000,
            fecha: mes,
            proveedor: 'Railway',
            registradoPorId: admin.id,
          },
          {
            categoria: 'MATERIALES',
            descripcion: 'Cuadernillos y stickers',
            monto: 60000,
            fecha: mes,
            registradoPorId: admin.id,
          },
        ],
      });
    }
  }

  console.log(`  demo: ${estudiantes.length} estudiantes, 2 grupos, 2 tutores, finanzas de 3 meses`);
  console.log('  contrasena de todas las cuentas demo: Demo1234*');
}

async function main() {
  console.log('Sembrando base de datos...');
  await seedCurriculum();
  const admin = await seedAdmin();
  if (CON_DEMO) await seedDemo(admin);
  console.log('Listo.');
}

main()
  .catch((error) => {
    console.error('Error al sembrar la base de datos:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
