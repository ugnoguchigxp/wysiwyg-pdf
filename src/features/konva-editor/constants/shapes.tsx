import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Circle,
  Database,
  Diamond,
  Heart,
  Hexagon,
  Home,
  Pentagon,
  Square,
  Star,
  Triangle,
} from 'lucide-react'

// Custom Icon for Trapezoid
const TrapezoidIcon = ({ size = 20, className = '', title = 'Trapezoid' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <title>{title}</title>
    <path d="M4 20h16l-4-16H8L4 20z" />
  </svg>
)

const ConeIcon = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2L4 18a4 2 0 0 0 8 2 4 2 0 0 0 8-2L12 2z" />
    <ellipse cx="12" cy="18" rx="8" ry="2" />
  </svg>
)

export const EDITOR_SHAPES = [
  { type: 'rect', icon: <Square size={20} />, label: 'Rectangle' },
  { type: 'circle', icon: <Circle size={20} />, label: 'Circle' },
  { type: 'triangle', icon: <Triangle size={20} />, label: 'Triangle' },
  { type: 'trapezoid', icon: <TrapezoidIcon size={20} />, label: 'Trapezoid' },
  { type: 'diamond', icon: <Diamond size={20} />, label: 'Diamond' },
  { type: 'cylinder', icon: <Database size={20} />, label: 'Cylinder' },
  { type: 'heart', icon: <Heart size={20} />, label: 'Heart' },
  { type: 'star', icon: <Star size={20} />, label: 'Star' },
  { type: 'pentagon', icon: <Pentagon size={20} />, label: 'Pentagon' },
  { type: 'hexagon', icon: <Hexagon size={20} />, label: 'Hexagon' },
  { type: 'arrow-u', icon: <ArrowUp size={20} />, label: 'Arrow Up' },
  { type: 'arrow-d', icon: <ArrowDown size={20} />, label: 'Arrow Down' },
  { type: 'arrow-l', icon: <ArrowLeft size={20} />, label: 'Arrow Left' },
  { type: 'arrow-r', icon: <ArrowRight size={20} />, label: 'Arrow Right' },
  { type: 'cone', icon: <ConeIcon size={20} />, label: 'Cone' },
  { type: 'house', icon: <Home size={20} />, label: 'House' },
] as const

export type EditorShapeType = (typeof EDITOR_SHAPES)[number]['type']
