/**
 * Iconos de la plataforma.
 *
 * Todo pasa por aqui en vez de importar lucide-react en cada pagina, por dos
 * razones: se nombran por lo que significan ("estudiantes") y no por como se
 * dibujan ("Baby"), y cambiar el icono de un concepto se hace en un sitio.
 *
 * Se dibujan con trazo, no rellenos, para que hereden el color del texto que
 * acompanan y no compitan con el.
 */
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Banknote,
  BellRing,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ContactRound,
  Eye,
  EyeOff,
  GraduationCap,
  Hand,
  Home,
  Inbox,
  KeyRound,
  Lightbulb,
  Lock,
  Mail,
  Menu,
  PartyPopper,
  Pencil,
  Phone,
  Receipt,
  Rocket,
  Scale,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Video,
  Wallet,
  X,
} from 'lucide-react';

const ICONOS = {
  // Navegacion
  inicio: Home,
  curriculo: BookOpen,
  grupos: Users,
  estudiantes: GraduationCap,
  usuarios: KeyRound,
  finanzas: Wallet,
  sugerencias: Lightbulb,
  interesados: ContactRound,
  cuenta: Settings,
  menu: Menu,

  // Acciones
  editar: Pencil,
  eliminar: Trash2,
  cerrar: X,
  volver: ArrowLeft,
  desplegar: ChevronRight,
  plegar: ChevronDown,
  ver: Eye,
  ocultar: EyeOff,

  // Estados y avisos
  bloqueado: Lock,
  aviso: AlertTriangle,
  prohibido: Ban,
  hecho: CheckCircle2,
  pendiente: BellRing,
  celebrar: PartyPopper,
  vacio: Inbox,
  saludo: Hand,
  aCargo: Hand,

  // Conceptos del curso
  clase: Video,
  telefono: Phone,
  correo: Mail,
  calendario: CalendarDays,
  asistencia: ClipboardList,
  empezar: Rocket,

  // Finanzas
  ingresos: TrendingUp,
  gastos: TrendingDown,
  balance: Scale,
  recibo: Receipt,
  dinero: Banknote,
};

/**
 * `nombre` es una clave de ICONOS. Si llega una desconocida no se dibuja nada:
 * un hueco se nota y se corrige, un icono equivocado pasa desapercibido.
 */
export default function Icono({ nombre, size = 20, className = '', ...resto }) {
  const Dibujo = ICONOS[nombre];
  if (!Dibujo) return null;
  return <Dibujo size={size} className={className} aria-hidden="true" strokeWidth={2} {...resto} />;
}

export { ICONOS };
