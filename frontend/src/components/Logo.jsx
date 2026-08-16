/**
 * La marca, en un solo sitio.
 *
 * La imagen sale de `public/logo.svg`: para cambiar el logo basta con sustituir
 * ese fichero, sin tocar codigo. Aqui solo se decide el tamano y si va con el
 * nombre al lado.
 */
export default function Logo({ tamano = 36, conNombre = true, subtitulo, className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.svg"
        alt="Python Kids"
        width={tamano}
        height={tamano}
        className="shrink-0 rounded-lg"
      />
      {conNombre && (
        <span className="leading-tight">
          <span className="block font-bold text-slate-900">Python Kids</span>
          {subtitulo && <span className="block text-xs text-slate-500">{subtitulo}</span>}
        </span>
      )}
    </span>
  );
}
