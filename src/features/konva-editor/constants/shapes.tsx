
import {
    Square,
    Circle,
    Triangle,
    Diamond,
    Database,
    Heart,
    Star,
    Pentagon,
    Hexagon,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Trees,
    Home,
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
    { type: 'tree', icon: <Trees size={20} />, label: 'Tree' },
    { type: 'house', icon: <Home size={20} />, label: 'House' },
] as const

export type EditorShapeType = typeof EDITOR_SHAPES[number]['type']
