
import type { ShapeNode } from '@/types/canvas'
import { mmToPtValue } from '../utils'

export const RenderShape = ({ element }: { element: ShapeNode }) => {
    const { shape } = element
    const width = mmToPtValue(element.w)
    const height = mmToPtValue(element.h)
    const fill = element.fill || 'none'
    const stroke = element.stroke || 'none'
    const strokeWidth = mmToPtValue(element.strokeW || 1)

    switch (shape) {
        case 'rect':
            return (
                <rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    rx={mmToPtValue(element.radius)}
                />
            )
        case 'circle':
            return (
                <ellipse
                    cx={width / 2}
                    cy={height / 2}
                    rx={width / 2}
                    ry={height / 2}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                />
            )
        case 'triangle': {
            const points = `${width / 2}, 0 ${width},${height} 0, ${height} `
            return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        }
        case 'diamond': {
            const points = `${width / 2}, 0 ${width},${height / 2} ${width / 2},${height} 0, ${height / 2} `
            return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        }
        case 'arrow-u':
            return (
                <path
                    d="M12 4l-8 8h6v8h4v-8h6z"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    transform={`scale(${width / 24}, ${height / 24})`}
                    vectorEffect="non-scaling-stroke"
                />
            )
        // Add other shapes as needed...
        default:
            return null
    }
}
