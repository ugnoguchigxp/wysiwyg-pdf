import { useEffect, useState } from 'react'
import { Image as KonvaImage, Rect as KonvaRect } from 'react-konva'
import { findImageWithExtension } from '@/features/konva-editor/utils/canvasImageUtils'
import type { Surface } from '@/types/canvas'

interface PageBackgroundProps {
    width: number
    height: number
    surface: Surface
}

export const PageBackground = ({ width, height, surface }: PageBackgroundProps) => {
    const [image, setImage] = useState<HTMLImageElement | null>(null)

    const bg = surface.bg
    const isColor = bg ? bg.startsWith('#') || bg.startsWith('rgb') : true

    useEffect(() => {
        if (!bg || isColor) {
            setImage(null)
            return
        }

        if (!bg.startsWith('http') && !bg.startsWith('data:')) {
            findImageWithExtension(bg).then((res) => {
                if (res) setImage(res.img)
            })
        } else {
            const img = new window.Image()
            img.src = bg
            img.onload = () => setImage(img)
        }
    }, [bg, isColor])

    return (
        <>
            <KonvaRect
                name="_background"
                x={0}
                y={0}
                width={width}
                height={height}
                fill={isColor ? bg || '#ffffff' : '#ffffff'}
                shadowColor="black"
                shadowBlur={10}
                shadowOpacity={0.1}
            />
            {image && (
                <KonvaImage
                    name="_background"
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    image={image}
                    listening={false}
                />
            )}
        </>
    )
}
