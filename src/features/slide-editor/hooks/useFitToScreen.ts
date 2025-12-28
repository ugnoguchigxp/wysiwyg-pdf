import { type RefObject, useCallback, useEffect, useState } from 'react'
import { mmToPx } from '@/utils/units'

/**
 * Calculates the zoom level to fit a slide within a container.
 * @param containerRef Reference to the container element
 * @param slideWidthMm Slide width in mm
 * @param slideHeightMm Slide height in mm
 * @param marginRatio Factor to apply to the fitted size (e.g. 0.9 for 90% fit)
 * @returns [zoom, recalculate]
 */
export function useFitToScreen(
    containerRef: RefObject<HTMLElement | null>,
    slideWidthMm: number,
    slideHeightMm: number,
    marginRatio = 0.9
) {
    const [zoom, setZoom] = useState(100)

    const calculateZoom = useCallback(() => {
        if (!containerRef.current) return

        const { clientWidth, clientHeight } = containerRef.current
        if (clientWidth === 0 || clientHeight === 0) return

        // Standard DPI for display calculation
        const dpi = 96
        const slideWidthPx = mmToPx(slideWidthMm, { dpi })
        const slideHeightPx = mmToPx(slideHeightMm, { dpi })

        const fitW = clientWidth / slideWidthPx
        const fitH = clientHeight / slideHeightPx

        const scale = Math.min(fitW, fitH) * marginRatio

        // Round to integer percentage
        setZoom(Math.floor(scale * 100))
    }, [containerRef, slideWidthMm, slideHeightMm, marginRatio])

    useEffect(() => {
        if (!containerRef.current) return

        const observer = new ResizeObserver(() => {
            calculateZoom()
        })

        observer.observe(containerRef.current)

        // Initial calc
        calculateZoom()

        return () => observer.disconnect()
    }, [containerRef, calculateZoom])

    return { zoom, calculateZoom }
}
