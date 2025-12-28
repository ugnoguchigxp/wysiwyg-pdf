import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import { X, ChevronLeft, ChevronRight, Maximize } from 'lucide-react'
import type { Doc } from '@/types/canvas'
import { CanvasElementRenderer } from '@/components/canvas/CanvasElementRenderer'

// import { useSlideSelection } from '../hooks/useSlideSelection'

interface PresentationModeProps {
    doc: Doc
    initialSlideId: string
    onExit: () => void
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
    doc,
    initialSlideId,
    onExit,
}) => {
    const containerRef = useRef<HTMLDivElement>(null)

    // Use surfaces filter to get slides
    const slides = doc.surfaces.filter(s => s.type === 'slide')
    const [currentIndex, setCurrentIndex] = useState(() => {
        const idx = slides.findIndex(s => s.id === initialSlideId)
        return idx >= 0 ? idx : 0
    })

    const currentSlide = slides[currentIndex]
    const currentNodes = doc.nodes.filter(n => n.s === currentSlide.id)

    const [scale, setScale] = useState(1)
    const [dimensions, setDimensions] = useState({ w: 0, h: 0 })

    // Request Fullscreen on mount
    // Fullscreen behavior handling
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                // If we were in fullscreen and exited, we might want to exit presentation mode?
                // Or just stay in presentation mode but windowed? 
                // Usually user expects Esc -> Exit Fullscreen -> Exit Presentation.
                // But Esc key handler handles Exit Presentation directly.
                // Let's leave this blank for now or just ensure state consistency.
            }
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
        }
    }, [])

    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error('Failed to enter fullscreen:', err)
            })
        } else {
            document.exitFullscreen()
        }
    }, [])

    // Fit slide to screen
    useEffect(() => {
        const updateSize = () => {
            if (!containerRef.current) return
            const { clientWidth, clientHeight } = containerRef.current
            setDimensions({ w: clientWidth, h: clientHeight })

            // Fit slide (mm) to screen (px) directly
            const slideW = currentSlide?.w || 297
            const slideH = currentSlide?.h || 210

            const scaleW = clientWidth / slideW
            const scaleH = clientHeight / slideH
            setScale(Math.min(scaleW, scaleH))
        }
        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    const nextSlide = useCallback(() => {
        setCurrentIndex(prev => Math.min(prev + 1, slides.length - 1))
    }, [slides.length])

    const prevSlide = useCallback(() => {
        setCurrentIndex(prev => Math.max(prev - 1, 0))
    }, [])

    // Keyboard navigation
    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Space') {
                nextSlide()
            } else if (e.key === 'ArrowLeft') {
                prevSlide()
            } else if (e.key === 'Escape') {
                if (document.fullscreenElement) {
                    document.exitFullscreen()
                }
                onExit()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [nextSlide, prevSlide, onExit])


    if (!currentSlide) return null

    // Center stage
    // scale converts mm -> px directly now.
    const stageW = (currentSlide.w || 297) * scale
    const stageH = (currentSlide.h || 210) * scale

    const stageX = (dimensions.w - stageW) / 2
    const stageY = (dimensions.h - stageH) / 2

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 bg-black z-[9999] flex items-center justify-center focus:outline-none"
            onClick={nextSlide}
        >
            <Stage
                width={dimensions.w}
                height={dimensions.h}
                scale={{ x: scale, y: scale }}
                x={stageX}
                y={stageY}
            >
                <Layer>
                    {/* Background */}
                    <Rect
                        width={currentSlide.w || 297}
                        height={currentSlide.h || 210}
                        fill={currentSlide.bg || '#ffffff'}
                    />
                    {currentNodes.map(node => (
                        <CanvasElementRenderer
                            key={node.id}
                            element={node}
                            isSelected={false}
                            allElements={currentNodes}
                            stageScale={scale}
                            onSelect={() => { }}
                            onChange={() => { }}
                            readOnly={true}
                        />
                    ))}
                </Layer>
            </Stage>

            {/* Floating Controls (show on hover?) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 opacity-0 hover:opacity-100 transition-opacity bg-black/50 p-2 rounded-full" onClick={e => e.stopPropagation()}>
                <button onClick={prevSlide} className="text-white hover:text-primary"><ChevronLeft /></button>
                <span className="text-white text-sm">{currentIndex + 1} / {slides.length}</span>
                <button onClick={nextSlide} className="text-white hover:text-primary"><ChevronRight /></button>
                <button onClick={toggleFullscreen} className="text-white hover:text-primary"><Maximize /></button>
                <button onClick={onExit} className="text-white hover:text-destructive ml-4"><X /></button>
            </div>
        </div>
    )
}
