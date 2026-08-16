/**
 * Formularios y piezas del curriculo, compartidos entre el catalogo de cursos
 * y el detalle de un curso.
 */
import { useState } from 'react';
import { api } from '../../api/client.js';
import { Badge, Campo, MensajeError, Modal } from '../ui.jsx';
import Icono from '../Icono.jsx';

const MODULO_VACIO = { numero: '', nombre: '', objetivo: '', descripcion: '' };
const CLASE_VACIA = { numeroClase: '', nombre: '', objetivo: '', contenido: '', conceptosClave: '', recursosUrl: '' };
const CURSO_VACIO = { nombre: '', descripcion: '', duracionMeses: '', edadSugerida: '' };

export function FormularioCurso({ valorInicial, onCerrar, onGuardado }) {
  const [form, setForm] = useState(valorInicial ?? CURSO_VACIO);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const editando = Boolean(valorInicial?.id);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const cuerpo = {
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        duracionMeses: form.duracionMeses === '' ? null : Number(form.duracionMeses),
        edadSugerida: form.edadSugerida || null,
      };
      if (editando) await api.patch(`/curriculum/courses/${valorInicial.id}`, cuerpo);
      else await api.post('/curriculum/courses', cuerpo);
      onGuardado();
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal abierto titulo={editando ? 'Editar curso' : 'Nuevo curso'} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Nombre del curso" requerido>
          <input
            className="input"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Scratch para principiantes"
            required
          />
        </Campo>

        <Campo etiqueta="Descripción">
          <textarea
            className="input"
            rows={2}
            value={form.descripcion ?? ''}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Duración en meses">
            <input
              type="number"
              min="1"
              className="input"
              value={form.duracionMeses ?? ''}
              onChange={(e) => setForm({ ...form, duracionMeses: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="Edad sugerida">
            <input
              className="input"
              value={form.edadSugerida ?? ''}
              onChange={(e) => setForm({ ...form, edadSugerida: e.target.value })}
              placeholder="8 a 10 años"
            />
          </Campo>
        </div>

        <MensajeError error={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function FormularioModulo({ abierto, courseId, valorInicial, onCerrar, onGuardado }) {
  const [form, setForm] = useState(valorInicial ?? MODULO_VACIO);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const editando = Boolean(valorInicial?.id);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const cuerpo = {
        courseId,
        numero: Number(form.numero),
        nombre: form.nombre,
        objetivo: form.objetivo,
        descripcion: form.descripcion || null,
      };
      if (editando) await api.patch(`/curriculum/modules/${valorInicial.id}`, cuerpo);
      else await api.post('/curriculum/modules', cuerpo);
      onGuardado();
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal abierto={abierto} titulo={editando ? 'Editar módulo' : 'Nuevo módulo'} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Número de módulo" requerido ayuda="La numeración es propia de cada curso.">
          <input
            type="number"
            min="1"
            className="input"
            value={form.numero}
            onChange={(e) => setForm({ ...form, numero: e.target.value })}
            required
          />
        </Campo>
        <Campo etiqueta="Nombre" requerido>
          <input
            className="input"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
        </Campo>
        <Campo etiqueta="Objetivo" requerido>
          <textarea
            className="input"
            rows={2}
            value={form.objetivo}
            onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
            required
          />
        </Campo>
        <Campo etiqueta="Descripción">
          <textarea
            className="input"
            rows={2}
            value={form.descripcion ?? ''}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </Campo>

        <MensajeError error={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function FormularioClase({ abierto, moduleId, valorInicial, onCerrar, onGuardado }) {
  const [form, setForm] = useState(
    valorInicial
      ? { ...valorInicial, conceptosClave: (valorInicial.conceptosClave ?? []).join(', ') }
      : CLASE_VACIA,
  );
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const editando = Boolean(valorInicial?.id);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const cuerpo = {
        numeroClase: Number(form.numeroClase),
        nombre: form.nombre,
        objetivo: form.objetivo,
        contenido: form.contenido,
        conceptosClave: form.conceptosClave
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        recursosUrl: form.recursosUrl || '',
      };
      if (editando) await api.patch(`/curriculum/classes/${valorInicial.id}`, cuerpo);
      else await api.post(`/curriculum/modules/${moduleId}/classes`, cuerpo);
      onGuardado();
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      titulo={editando ? 'Editar clase' : 'Nueva clase'}
      onCerrar={onCerrar}
      ancho="max-w-2xl"
    >
      <form onSubmit={enviar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <Campo etiqueta="N° clase" requerido>
            <input
              type="number"
              min="1"
              className="input"
              value={form.numeroClase}
              onChange={(e) => setForm({ ...form, numeroClase: e.target.value })}
              required
            />
          </Campo>
          <Campo etiqueta="Nombre" requerido>
            <input
              className="input"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </Campo>
        </div>

        <Campo etiqueta="Objetivo" requerido>
          <textarea
            className="input"
            rows={2}
            value={form.objetivo}
            onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
            required
          />
        </Campo>

        <Campo etiqueta="Contenido / plan de la clase" requerido>
          <textarea
            className="input"
            rows={4}
            value={form.contenido}
            onChange={(e) => setForm({ ...form, contenido: e.target.value })}
            required
          />
        </Campo>

        <Campo etiqueta="Conceptos clave" ayuda="Sepáralos con comas: variable, input, print">
          <input
            className="input"
            value={form.conceptosClave}
            onChange={(e) => setForm({ ...form, conceptosClave: e.target.value })}
          />
        </Campo>

        <Campo etiqueta="Enlace a recursos" ayuda="Opcional: presentación, ejercicios o repositorio">
          <input
            type="url"
            className="input"
            placeholder="https://..."
            value={form.recursosUrl ?? ''}
            onChange={(e) => setForm({ ...form, recursosUrl: e.target.value })}
          />
        </Campo>

        <MensajeError error={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function Clase({ clase, esAdmin, onEditar, onEliminar }) {
  const [abierta, setAbierta] = useState(false);
  // El backend marca como no accesible lo que el estudiante no ha comprado, y
  // en ese caso ni siquiera envia el contenido.
  const bloqueada = clase.accesible === false;

  if (bloqueada) {
    return (
      <li className="border-t border-slate-100">
        <div className="flex items-center gap-3 px-5 py-3 opacity-70">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400">
            {clase.numeroClase}
          </span>
          <span className="flex-1">
            <span className="block font-medium text-slate-500">{clase.nombre}</span>
            <span className="block text-xs text-slate-400">
              Esta clase no está incluida en lo que tienes. Pídesela a tu acudiente.
            </span>
          </span>
          <span title="Clase bloqueada" className="text-slate-400">
            <Icono nombre="bloqueado" size={18} />
          </span>
        </div>
      </li>
    );
  }

  return (
    <li className="border-t border-slate-100">
      <div className="flex items-start gap-3 px-5 py-3">
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          className="flex flex-1 items-start gap-3 text-left"
          aria-expanded={abierta}
        >
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marca-100 text-xs font-bold text-marca-700">
            {clase.numeroClase}
          </span>
          <span className="flex-1">
            <span className="block font-medium text-slate-800">{clase.nombre}</span>
            <span className="block text-xs text-slate-500">{clase.objetivo}</span>
          </span>
          <span className="mt-1 text-slate-400">
            <Icono nombre={abierta ? 'plegar' : 'desplegar'} size={16} />
          </span>
        </button>

        {esAdmin && (
          <div className="flex gap-1">
            <button type="button" onClick={onEditar} className="btn-ghost px-2 py-1" title="Editar clase" aria-label="Editar clase">
              <Icono nombre="editar" size={15} />
            </button>
            <button
              type="button"
              onClick={onEliminar}
              className="btn px-2 py-1 text-rose-600 hover:bg-rose-50"
              title="Eliminar clase"
              aria-label="Eliminar clase"
            >
              <Icono nombre="eliminar" size={15} />
            </button>
          </div>
        )}
      </div>

      {abierta && (
        <div className="bg-slate-50/70 px-5 py-4 pl-16 text-sm text-slate-600">
          <p className="whitespace-pre-line">{clase.contenido}</p>
          {clase.conceptosClave?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {clase.conceptosClave.map((c) => (
                <Badge key={c} tono="azul">
                  {c}
                </Badge>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">Duración: {clase.duracionMinutos} minutos</p>
          {clase.recursosUrl && (
            <a
              href={clase.recursosUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs font-semibold text-marca-600 hover:underline"
            >
              Abrir recursos →
            </a>
          )}
        </div>
      )}
    </li>
  );
}
