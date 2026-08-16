import { pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { curriculum } from './curriculum.js';

const prisma = new PrismaClient();

// Se recortan los espacios: al pegar valores en un panel como el de Railway es
// facil arrastrar un espacio o un salto de linea, y eso rompe el login sin dar
// ninguna pista.
const ADMIN_PASSWORD_CRUDO = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123*';
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? 'admin@pythonkids.com').trim().toLowerCase();
const ADMIN_PASSWORD = ADMIN_PASSWORD_CRUDO.trim();
// Escotilla de emergencia para cuando se pierde el acceso al administrador.
const RESET_ADMIN = process.env.RESET_ADMIN_PASSWORD === 'true';
/**
 * Los datos de ejemplo hay que pedirlos: SEED_DEMO=true.
 *
 * Antes venian activados salvo que se dijera lo contrario, y eso resucitaba a
 * las familias de muestra en cada despliegue despues de haberlas borrado a mano.
 * Inventar datos es lo raro; el valor por defecto tiene que ser no hacerlo.
 */
const CON_DEMO = process.env.SEED_DEMO === 'true';

const hash = (plain) => bcrypt.hash(plain, 10);
const periodo = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

// Id estable del curso base: lo crea la migracion que introdujo los cursos, y
// el seed lo reutiliza para no duplicarlo.
const CURSO_PYTHON_ID = 'curso-python-kids';

/** Crea o actualiza el curso base con sus 11 modulos de 4 clases. */
async function seedCurriculum() {
  const curso = await prisma.course.upsert({
    where: { id: CURSO_PYTHON_ID },
    update: {},
    create: {
      id: CURSO_PYTHON_ID,
      nombre: 'Python para ninos',
      descripcion:
        'Curso de Python desde cero: 11 modulos de 4 clases, una clase semanal de una hora.',
      duracionMeses: 11,
      edadSugerida: '8 a 10 anos',
      orden: 1,
    },
  });

  for (const modulo of curriculum) {
    // `update` vacio a proposito: si el modulo ya existe se deja como esta. Con
    // los textos aqui, editar un modulo desde la plataforma duraba hasta el
    // siguiente despliegue, que lo devolvia al original sin avisar.
    const registro = await prisma.module.upsert({
      where: { courseId_numero: { courseId: curso.id, numero: modulo.numero } },
      update: {},
      create: {
        courseId: curso.id,
        numero: modulo.numero,
        nombre: modulo.nombre,
        objetivo: modulo.objetivo,
        descripcion: modulo.descripcion,
        orden: modulo.numero,
      },
    });

    for (const clase of modulo.clases) {
      // Igual que los modulos: lo que ya existe no se toca.
      await prisma.class.upsert({
        where: { moduleId_numeroClase: { moduleId: registro.id, numeroClase: clase.numeroClase } },
        update: {},
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

  const [modulos, clases] = await Promise.all([
    prisma.module.count({ where: { courseId: curso.id } }),
    prisma.class.count({ where: { module: { courseId: curso.id } } }),
  ]);
  console.log(`  curso "${curso.nombre}": ${modulos} modulos, ${clases} clases`);
  return curso;
}

async function seedAdmin() {
  if (ADMIN_PASSWORD !== ADMIN_PASSWORD_CRUDO) {
    console.warn('  aviso: SEED_ADMIN_PASSWORD tenia espacios sobrantes; se ignoraron.');
  }

  const existente = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (!existente) {
    const admin = await prisma.user.create({
      data: {
        nombre: 'Administrador',
        email: ADMIN_EMAIL,
        passwordHash: await hash(ADMIN_PASSWORD),
        rol: 'ADMIN',
      },
    });
    console.log(`  admin CREADO: ${admin.email} (entra con la clave de SEED_ADMIN_PASSWORD)`);
    return admin;
  }

  // La cuenta ya existe: no se pisa su contrasena salvo peticion explicita, para
  // no revertir un cambio hecho desde la plataforma en cada despliegue.
  if (RESET_ADMIN) {
    const admin = await prisma.user.update({
      where: { id: existente.id },
      data: { passwordHash: await hash(ADMIN_PASSWORD), rol: 'ADMIN', activo: true },
    });
    console.log(`  admin RESTABLECIDO: ${admin.email} (nueva clave = SEED_ADMIN_PASSWORD)`);
    console.log('  recuerda quitar RESET_ADMIN_PASSWORD despues de entrar.');
    return admin;
  }

  console.log(`  admin YA EXISTIA: ${existente.email} (su contrasena no se toca)`);
  console.log('  si no puedes entrar, arranca una vez con RESET_ADMIN_PASSWORD=true.');
  return existente;
}

async function crearUsuario({ nombre, email, rol, telefono }) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { nombre, email, rol, telefono, passwordHash: await hash('Demo1234*') },
  });
}

async function seedDemo(admin, curso) {
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
    const data = { nombre, tutorId, diaSemana, hora, fechaInicio: inicio, cupoMaximo: 8, courseId: curso.id };
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
    where: { module: { courseId: curso.id } },
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

/**
 * Siembra la base. Es idempotente (todo son upserts), asi que se puede
 * ejecutar tantas veces como haga falta sin duplicar nada.
 */
export async function seed() {
  try {
    console.log('Sembrando base de datos...');
    const curso = await seedCurriculum();
    const admin = await seedAdmin();
    if (CON_DEMO) {
      console.log('  SEED_DEMO=true: creando datos de ejemplo (familias y finanzas de muestra).');
      await seedDemo(admin, curso);
    } else {
      console.log('  sin datos de ejemplo (SEED_DEMO no es "true").');
    }
    console.log('Listo.');
  } finally {
    await prisma.$disconnect();
  }
}

// Solo se ejecuta sola cuando se invoca como `node prisma/seed.js`; si otro
// modulo la importa (el bootstrap del arranque), decide el llamador.
const invocadaDirectamente =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invocadaDirectamente) {
  seed().catch((error) => {
    console.error('Error al sembrar la base de datos:', error);
    process.exit(1);
  });
}
