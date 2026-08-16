import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useFetch } from '../hooks/useApi.js';
import { Campo, Cargando, MensajeError } from '../components/ui.jsx';
import Icono from '../components/Icono.jsx';
import Logo from '../components/Logo.jsx';
import Fondo from '../components/Fondo.jsx';

const VACIO = {
  nombre: '',
  telefono: '',
  email: '',
  nombreEstudiante: '',
  edadEstudiante: '',
  mensaje: '',
  courseId: '',
  web: '',
};

/**
 * Pagina publica. Es lo primero que ve alguien que llega por un enlace, asi que
 * su trabajo es explicar el curso y recoger un telefono al que llamar. No pide
 * crear una cuenta: la crea el vendedor cuando el pago esta confirmado.
 */
export default function Portada() {
  const { data: cursos, cargando, error } = useFetch('/public/courses');
  const [form, setForm] = useState(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [enviado, setEnviado] = useState(false);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

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
        mensaje: form.mensaje || undefined,
      });
      setEnviado(true);
    } catch (err) {
      setErrorEnvio(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50">
      <Fondo />

      <header className="relative border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Logo tamano={38} subtitulo="Programación para niños" />
          {/* Quien llega a la portada es una familia, asi que "Entrar" lleva a
              su puerta. El equipo entra por el enlace del pie. */}
          <Link to="/soy-estudiante" className="btn-secondary text-sm">
            Entrar
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 py-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Tu hijo puede crear sus propios juegos y programas
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Clases en vivo, una vez por semana, en grupos pequeños. Déjanos tus datos y te
            llamamos para contarte cómo funciona y resolver tus dudas.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* Los cursos, para que sepa que esta pidiendo */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900">Nuestros cursos</h2>
            {cargando && <Cargando />}
            <MensajeError error={error} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(cursos ?? []).map((c) => (
                <article key={c.id} className="card p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-marca-500 text-white">
                    <Icono nombre="curriculo" size={22} />
                  </span>
                  <h3 className="mt-3 font-bold text-slate-900">{c.nombre}</h3>
                  {c.descripcion && <p className="mt-1 text-sm text-slate-600">{c.descripcion}</p>}
                  <dl className="mt-3 space-y-1.5 text-sm text-slate-500">
                    {c.edadSugerida && (
                      <div className="flex items-center gap-2">
                        <Icono nombre="estudiantes" size={16} /> Edad: {c.edadSugerida}
                      </div>
                    )}
                    {c.duracionMeses && (
                      <div className="flex items-center gap-2">
                        <Icono nombre="calendario" size={16} /> Duración: {c.duracionMeses} meses
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Icono nombre="curriculo" size={16} /> {c.modulos} módulos
                    </div>
                  </dl>
                  <button
                    type="button"
                    className="btn-secondary mt-4 w-full text-sm"
                    onClick={() => {
                      setForm((f) => ({ ...f, courseId: c.id }));
                      document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Quiero información
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section id="formulario" className="lg:sticky lg:top-6 lg:self-start">
            {enviado ? (
              <div className="card p-6 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Icono nombre="hecho" size={30} />
                </span>
                <h2 className="mt-3 text-xl font-bold text-slate-900">¡Gracias!</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Recibimos tus datos. Te llamaremos pronto al número que nos dejaste para contarte
                  todo y resolver tus dudas.
                </p>
                <button
                  type="button"
                  className="btn-secondary mt-5 text-sm"
                  onClick={() => {
                    setForm(VACIO);
                    setEnviado(false);
                  }}
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <form onSubmit={enviar} className="card space-y-4 p-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Déjanos tus datos</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Te llamamos sin compromiso. No necesitas crear ninguna cuenta.
                  </p>
                </div>

                <Campo etiqueta="Tu nombre" requerido>
                  <input
                    className="input"
                    value={form.nombre}
                    onChange={cambiar('nombre')}
                    placeholder="Nombre del papá, mamá o acudiente"
                    required
                  />
                </Campo>

                <Campo etiqueta="Teléfono / WhatsApp" requerido>
                  <input
                    className="input"
                    value={form.telefono}
                    onChange={cambiar('telefono')}
                    placeholder="300 123 4567"
                    required
                  />
                </Campo>

                <Campo etiqueta="Correo electrónico" ayuda="Opcional, por si prefieres que te escribamos.">
                  <input type="email" className="input" value={form.email} onChange={cambiar('email')} />
                </Campo>

                <Campo etiqueta="Curso que te interesa" requerido>
                  <select className="input" value={form.courseId} onChange={cambiar('courseId')} required>
                    <option value="">Elige un curso…</option>
                    {(cursos ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>

                <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
                  <Campo etiqueta="Nombre del niño o niña">
                    <input className="input" value={form.nombreEstudiante} onChange={cambiar('nombreEstudiante')} />
                  </Campo>
                  <Campo etiqueta="Edad">
                    <input
                      type="number"
                      min="3"
                      max="18"
                      className="input"
                      value={form.edadEstudiante}
                      onChange={cambiar('edadEstudiante')}
                    />
                  </Campo>
                </div>

                <Campo etiqueta="¿Algo que quieras contarnos?">
                  <textarea className="input" rows={3} value={form.mensaje} onChange={cambiar('mensaje')} />
                </Campo>

                {/* Trampa para bots: nadie que use la pagina lo ve ni lo enfoca. */}
                <div className="hidden" aria-hidden="true">
                  <label>
                    No rellenes este campo
                    <input tabIndex={-1} autoComplete="off" value={form.web} onChange={cambiar('web')} />
                  </label>
                </div>

                <MensajeError error={errorEnvio} />

                <button type="submit" className="btn-primary h-12 w-full text-base" disabled={enviando}>
                  {enviando ? 'Enviando…' : 'Quiero que me contacten'}
                </button>
              </form>
            )}
          </section>
        </div>
      </main>

      <footer className="relative border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-5xl px-4 text-sm text-slate-500">
          ¿Eres del equipo?{' '}
          <Link to="/login" className="font-semibold text-marca-600 hover:underline">
            Entra por aquí
          </Link>
        </div>
      </footer>
    </div>
  );
}
