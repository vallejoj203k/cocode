import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useFetch } from '../hooks/useApi.js';
import { Cargando, MensajeError } from '../components/ui.jsx';
import Aparece from '../components/portada/Aparece.jsx';
import Mascota from '../components/portada/Mascota.jsx';
import { LEMA, MARCA } from '../lib/marca.js';

const VACIO = {
  nombre: '',
  telefono: '',
  email: '',
  nombreEstudiante: '',
  edadEstudiante: '',
  courseId: '',
  web: '',
};

const APRENDIZAJES = [
  {
    titulo: 'Pensar en pasos',
    texto: 'Secuencias, bucles y condicionales aplicados a algo que quiere construir.',
  },
  { titulo: 'Un lenguaje real', texto: 'Escribe código de verdad, no bloques de juguete.' },
  {
    titulo: 'Constancia',
    texto: 'Una clase por semana durante meses: hábito y avance visible.',
  },
  {
    titulo: 'Mostrar su trabajo',
    texto: 'Cada módulo termina en un proyecto que puede presentar y explicar.',
  },
];

const PREGUNTAS = [
  {
    p: '¿Necesita saber algo antes?',
    r: 'No. Todos los cursos empiezan desde cero. Solo hace falta un computador con internet.',
  },
  {
    p: '¿Cómo son las clases?',
    r: 'En vivo con el profesor, una vez por semana, en grupos pequeños con atención directa.',
  },
  {
    p: '¿Qué curso le corresponde?',
    r: 'Cada curso indica la edad para la que está pensado. Si dudas, te ayudamos a elegir en la llamada.',
  },
  {
    p: '¿Se puede probar antes?',
    r: 'Sí, la clase de prueba es gratis y sin compromiso. No necesitas crear ninguna cuenta.',
  },
];

/** Iniciales para el cuadrito de color de cada curso: "Python para niños" → "Py". */
const iniciales = (nombre) => {
  const limpio = nombre.replace(/[^\p{L}\s]/gu, ' ').trim();
  const palabra = limpio.split(/\s+/)[0] ?? '';
  return (palabra.slice(0, 2) || '··').replace(/^./, (c) => c.toUpperCase());
};

function Campo({ etiqueta, requerido, ancho = '', children }) {
  return (
    <label className={`grid gap-1.5 ${ancho}`}>
      <span className="text-[13px] font-bold text-tinta-700">
        {etiqueta} {requerido && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const ENTRADA =
  'rounded-[10px] border border-tinta-900/15 bg-[#FBFBFD] px-3.5 py-3 text-[15px] text-tinta-900 outline-none transition ' +
  'focus:border-logic-500 focus:bg-white focus:ring-4 focus:ring-logic-500/12';

/**
 * Portada publica. Es lo primero que ve alguien que llega por un enlace, asi que
 * su trabajo es explicar los cursos y recoger un telefono al que llamar. No pide
 * crear una cuenta: la crea el vendedor cuando el pago esta confirmado.
 */
export default function Portada() {
  const { data: cursos, cargando, error } = useFetch('/public/courses');
  const { data: config } = useFetch('/public/config');
  const [form, setForm] = useState(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [enviado, setEnviado] = useState(false);
  const barra = useRef(null);

  // La barra de progreso se pinta desde la mascota, que ya mide el scroll en
  // cada fotograma: medirlo dos veces seria trabajo repetido.
  const alDesplazar = useCallback((p) => {
    if (barra.current) barra.current.style.width = `${(p * 100).toFixed(2)}%`;
  }, []);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const wa = config?.whatsapp
    ? `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(
        `Hola, quiero información sobre los cursos de ${MARCA}`,
      )}`
    : null;

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await api.post('/public/leads', {
        ...form,
        email: form.email || undefined,
        nombreEstudiante: form.nombreEstudiante || undefined,
        edadEstudiante: form.edadEstudiante === '' ? undefined : Number(form.edadEstudiante),
      });
      setEnviado(true);
    } catch (err) {
      setErrorEnvio(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-marca text-tinta-900">
      {/* Cuánto queda por leer. */}
      <div className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-logic-500/10">
        <div ref={barra} className="h-full w-0 bg-gradient-to-r from-logic-500 to-logic-300" />
      </div>

      <Mascota onProgreso={alDesplazar} />

      <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-tinta-900/[0.08] bg-white/[0.86] px-5 py-4 backdrop-blur-md sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt={MARCA} width="42" height="42" className="h-10 w-10 shrink-0" />
          <div className="grid">
            <span className="text-[18.5px] font-extrabold leading-tight tracking-tight">{MARCA}</span>
            <span className="hidden text-[12.5px] text-tinta-500 sm:block">{LEMA}</span>
          </div>
        </div>

        <nav className="flex items-center gap-5 lg:gap-6">
          <a href="#cursos" className="hidden text-[14.5px] font-semibold text-tinta-700 transition hover:text-logic-500 md:block">
            Cursos
          </a>
          <a href="#aprende" className="hidden text-[14.5px] font-semibold text-tinta-700 transition hover:text-logic-500 md:block">
            Qué aprende
          </a>
          <a href="#preguntas" className="hidden text-[14.5px] font-semibold text-tinta-700 transition hover:text-logic-500 lg:block">
            Preguntas
          </a>
          {/* Quien ya es alumno entra por su puerta; el equipo, desde el pie. */}
          <Link to="/soy-estudiante" className="text-[14.5px] font-semibold text-tinta-700 transition hover:text-logic-500">
            Entrar
          </Link>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-wapp-500 px-4 py-2.5 text-[14.5px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-wapp-600 sm:px-5"
            >
              WhatsApp
            </a>
          )}
        </nav>
      </header>

      {/* --- Portada y formulario ------------------------------------------ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-logic-50 to-[#FBFBFD] px-5 pb-20 pt-14 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[460px] w-[460px] rounded-full bg-logic-500/[0.07]" />
        <div className="pointer-events-none absolute -right-32 -top-36 h-[380px] w-[380px] rounded-full bg-logic-500/[0.05]" />

        <div className="relative mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[1fr_440px]">
          <div className="lp-entra lp-izquierda pt-3">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-logic-500/20 bg-white px-4 py-2 text-[13px] font-bold text-logic-500">
              <span className="lp-latido h-[7px] w-[7px] rounded-full bg-wapp-500" />
              Cupos abiertos · grupos pequeños
            </div>

            <h1 className="mt-6 text-[clamp(34px,4.4vw,60px)] font-extrabold leading-[1.06] tracking-[-0.03em] text-balance">
              Tu hijo puede crear sus propios juegos y programas
            </h1>
            <p className="mt-5 max-w-lg text-[19px] leading-relaxed text-tinta-600">
              Clases en vivo una vez por semana, en grupos pequeños, con un lenguaje de programación
              real. Empieza con una clase de prueba gratis.
            </p>

            <div className="mt-8 grid gap-3.5">
              {[
                'Varios cursos, cada uno con su lenguaje, según su edad e interés',
                'Programas largos con proyectos que se terminan',
                'Sin crear cuentas: te llamamos y te contamos todo',
              ].map((linea) => (
                <div key={linea} className="flex items-start gap-3">
                  <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-logic-200 text-[13px] font-extrabold text-logic-500">
                    ✓
                  </span>
                  <span className="text-base text-tinta-700">{linea}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            id="form"
            className="lp-entra lp-derecha scroll-mt-24 rounded-[18px] border border-tinta-900/[0.09] bg-white p-6 shadow-[0_24px_60px_-30px_rgba(20,24,36,0.28)] sm:p-8"
            style={{ animationDelay: '100ms' }}
          >
            {enviado ? (
              <div className="py-6 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-wapp-50 text-3xl text-wapp-500">
                  ✓
                </span>
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight">¡Gracias!</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-tinta-500">
                  Recibimos tus datos. Te llamamos pronto al número que nos dejaste para coordinar la
                  clase de prueba y resolver tus dudas.
                </p>
                <button
                  type="button"
                  className="mt-6 rounded-[10px] border border-tinta-900/15 px-5 py-3 text-[15px] font-bold text-tinta-700 transition hover:bg-logic-50"
                  onClick={() => {
                    setForm(VACIO);
                    setEnviado(false);
                  }}
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <form onSubmit={enviar}>
                <h2 className="text-2xl font-extrabold tracking-tight">Agenda la clase de prueba</h2>
                <p className="mb-6 mt-2 text-[14.5px] leading-relaxed text-tinta-500">
                  Gratis y sin compromiso. Te llamamos para coordinar el horario.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo etiqueta="Tu nombre" requerido ancho="sm:col-span-2">
                    <input
                      className={ENTRADA}
                      value={form.nombre}
                      onChange={cambiar('nombre')}
                      placeholder="Nombre del papá, mamá o acudiente"
                      required
                    />
                  </Campo>

                  <Campo etiqueta="Teléfono / WhatsApp" requerido>
                    <input
                      className={ENTRADA}
                      value={form.telefono}
                      onChange={cambiar('telefono')}
                      placeholder="300 123 4567"
                      required
                    />
                  </Campo>

                  <Campo etiqueta="Correo (opcional)">
                    <input type="email" className={ENTRADA} value={form.email} onChange={cambiar('email')} />
                  </Campo>

                  <Campo etiqueta="Curso que te interesa" requerido ancho="sm:col-span-2">
                    <select className={ENTRADA} value={form.courseId} onChange={cambiar('courseId')} required>
                      <option value="">Elige un curso…</option>
                      {(cursos ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                          {c.edadSugerida ? ` (${c.edadSugerida})` : ''}
                        </option>
                      ))}
                    </select>
                  </Campo>

                  <Campo etiqueta="Nombre del niño o niña">
                    <input className={ENTRADA} value={form.nombreEstudiante} onChange={cambiar('nombreEstudiante')} />
                  </Campo>

                  <Campo etiqueta="Edad">
                    <input
                      type="number"
                      min="3"
                      max="18"
                      className={ENTRADA}
                      value={form.edadEstudiante}
                      onChange={cambiar('edadEstudiante')}
                    />
                  </Campo>
                </div>

                {/* Trampa para bots: nadie que use la página lo ve ni lo enfoca. */}
                <div className="hidden" aria-hidden="true">
                  <label>
                    No rellenes este campo
                    <input tabIndex={-1} autoComplete="off" value={form.web} onChange={cambiar('web')} />
                  </label>
                </div>

                <MensajeError error={errorEnvio} />

                <button
                  type="submit"
                  disabled={enviando}
                  className="mt-6 w-full rounded-xl bg-logic-500 py-4 text-base font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-logic-600 hover:shadow-[0_12px_26px_-12px_rgba(46,56,201,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviando ? 'Enviando…' : 'Quiero mi clase de prueba gratis'}
                </button>

                {wa && (
                  <>
                    <div className="mt-3.5 flex items-center gap-2.5">
                      <span className="h-px flex-1 bg-tinta-900/10" />
                      <span className="text-[12.5px] text-tinta-300">o</span>
                      <span className="h-px flex-1 bg-tinta-900/10" />
                    </div>
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3.5 block rounded-xl border border-wapp-500/35 py-3.5 text-center text-[15px] font-bold text-wapp-500 transition hover:-translate-y-0.5 hover:bg-wapp-50"
                    >
                      Prefiero escribir por WhatsApp
                    </a>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </section>

      {/* --- Cursos --------------------------------------------------------- */}
      <section id="cursos" className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-20 sm:px-8 lg:px-12">
        <Aparece desde="arriba">
          <h2 className="text-[clamp(28px,3.4vw,38px)] font-extrabold tracking-[-0.025em]">Nuestros cursos</h2>
          <p className="mt-1.5 text-base text-tinta-500">Elige el que mejor le encaje por edad y por interés.</p>
        </Aparece>

        {cargando && <Cargando />}
        <MensajeError error={error} />

        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(cursos ?? []).map((c, i) => (
            <Aparece
              key={c.id}
              desde={i === 0 ? 'izquierda' : i === 1 ? 'abajo' : 'derecha'}
              retraso={i * 90}
              className="flex"
            >
              <article className="flex w-full flex-col rounded-[18px] border border-tinta-900/10 bg-white p-7 transition duration-300 hover:-translate-y-1.5 hover:border-logic-500 hover:shadow-[0_22px_50px_-28px_rgba(46,56,201,0.5)]">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-logic-500 text-lg font-extrabold text-white">
                    {iniciales(c.nombre)}
                  </span>
                  {c.edadSugerida && (
                    <span className="rounded-full bg-logic-100 px-3 py-1.5 text-xs font-extrabold text-logic-500">
                      {c.edadSugerida}
                    </span>
                  )}
                </div>

                <h3 className="mt-5 text-[21px] font-extrabold tracking-[-0.015em]">{c.nombre}</h3>
                {c.descripcion && (
                  <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-tinta-600">{c.descripcion}</p>
                )}

                <dl className="mt-5 grid gap-2 border-t border-tinta-900/[0.08] py-4 text-sm text-tinta-700">
                  {c.duracionMeses && (
                    <div className="flex justify-between">
                      <dt className="text-tinta-400">Duración</dt>
                      <dd className="font-bold">{c.duracionMeses} meses</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-tinta-400">Módulos</dt>
                    <dd className="font-bold">{c.modulos}</dd>
                  </div>
                </dl>

                <a
                  href="#form"
                  onClick={() => setForm((f) => ({ ...f, courseId: c.id }))}
                  className="rounded-[11px] bg-tinta-900 py-3.5 text-center text-[15px] font-bold text-white transition hover:bg-logic-500"
                >
                  Quiero información
                </a>
              </article>
            </Aparece>
          ))}
        </div>
      </section>

      {/* --- Qué aprende ---------------------------------------------------- */}
      <section id="aprende" className="mt-20 scroll-mt-20 bg-tinta-900 px-5 py-[76px] text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <Aparece desde="arriba">
            <h2 className="text-[clamp(28px,3.4vw,38px)] font-extrabold tracking-[-0.025em]">Qué aprende tu hijo</h2>
            <p className="mt-2 text-base text-white/60">
              Programar es la excusa. Lo que se queda es la forma de pensar.
            </p>
          </Aparece>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {APRENDIZAJES.map((a, i) => (
              <Aparece key={a.titulo} desde="abajo" retraso={i * 80} className="flex">
                <div className="w-full rounded-2xl border border-white/10 bg-white/[0.06] p-6 transition duration-300 hover:-translate-y-1.5 hover:bg-white/[0.11]">
                  <div className="text-[13px] font-extrabold tracking-[0.1em] text-logic-300">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="mb-2 mt-3 text-[17.5px] font-extrabold">{a.titulo}</h3>
                  <p className="text-[14.5px] leading-relaxed text-white/65">{a.texto}</p>
                </div>
              </Aparece>
            ))}
          </div>
        </div>
      </section>

      {/* --- Preguntas ------------------------------------------------------ */}
      <section id="preguntas" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-20 sm:px-8 lg:px-12">
        <Aparece desde="arriba">
          <h2 className="mb-8 text-center text-[clamp(28px,3.4vw,38px)] font-extrabold tracking-[-0.025em]">
            Preguntas frecuentes
          </h2>
        </Aparece>

        <div className="grid gap-3.5 md:grid-cols-2 md:gap-x-5">
          {PREGUNTAS.map((f, i) => (
            <Aparece key={f.p} desde={i % 2 ? 'derecha' : 'izquierda'} retraso={i * 70}>
              <details className="lp-faq h-full rounded-2xl bg-[#F7F8FC] px-6 py-5 transition hover:bg-logic-100">
                <summary className="flex items-center justify-between gap-4 text-[16.5px] font-bold">
                  {f.p}
                  <span className="lp-mas text-xl text-logic-500 transition-transform duration-200">+</span>
                </summary>
                <div className="mt-3 text-[14.5px] leading-relaxed text-tinta-600">{f.r}</div>
              </details>
            </Aparece>
          ))}
        </div>
      </section>

      {/* --- Cierre --------------------------------------------------------- */}
      <Aparece desde="abajo" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-10 rounded-[22px] bg-gradient-to-br from-logic-500 to-logic-700 p-8 text-white sm:p-13 lg:p-[52px]">
          <div>
            <h2 className="max-w-lg text-[clamp(26px,3vw,34px)] font-extrabold leading-tight tracking-[-0.025em]">
              ¿Hablamos hoy y le reservamos el cupo?
            </h2>
            <p className="mt-2.5 max-w-lg text-[16.5px] text-white/75">
              Te llamamos, te contamos cómo funciona y resolvemos tus dudas. Sin compromiso.
            </p>
          </div>
          <div className="grid flex-none gap-3">
            <a
              href="#form"
              className="rounded-xl bg-white px-7 py-4 text-center text-[15.5px] font-extrabold text-logic-500 transition hover:-translate-y-0.5 hover:bg-logic-200"
            >
              Dejar mis datos
            </a>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/40 px-7 py-[15px] text-center text-[15.5px] font-bold text-white transition hover:-translate-y-0.5 hover:border-white"
              >
                Escribir por WhatsApp
              </a>
            )}
          </div>
        </div>
      </Aparece>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-tinta-900/[0.08] px-5 py-6 text-[13px] text-tinta-400 sm:px-8 lg:px-12">
        <span>
          {MARCA} · {LEMA}
        </span>
        <span className="flex items-center gap-4">
          <span className="hidden sm:inline">Clases en vivo · Grupos pequeños</span>
          <Link to="/login" className="font-semibold text-logic-500 hover:underline">
            Entrada del equipo
          </Link>
        </span>
      </footer>
    </div>
  );
}
