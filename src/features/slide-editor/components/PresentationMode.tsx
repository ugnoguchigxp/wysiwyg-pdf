import { ChevronLeft, ChevronRight, Maximize, Minimize, Play, X } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Layer, Rect, Stage } from 'react-konva'
import { CanvasElementRenderer } from '@/components/canvas/CanvasElementRenderer'
import { cn } from '@/lib/utils'
import type { Doc } from '@/types/canvas'

interface PresentationModeProps {
  doc: Doc
  initialSlideId: string
  onExit: () => void
  className?: string
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  doc,
  initialSlideId,
  onExit,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Use surfaces filter to get slides
  const slides = doc.surfaces.filter((s) => s.type === 'slide')
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = slides.findIndex((s) => s.id === initialSlideId)
    return idx >= 0 ? idx : 0
  })

  const currentSlide = slides[currentIndex]
  const currentNodes = doc.nodes.filter((n) => n.s === currentSlide.id)

  const [scale, setScale] = useState(1)
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 })

  // Sync Fullscreen State
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
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

      // Add margin?
      const margin = isFullscreen ? 0 : 0
      const availW = clientWidth - margin
      const availH = clientHeight - margin

      const scaleW = availW / slideW
      const scaleH = availH / slideH
      setScale(Math.min(scaleW, scaleH))
    }

    // Initial and on resize
    updateSize()
    // Determine if we should also observe global resize or container resize
    const ro = new ResizeObserver(updateSize)
    if (containerRef.current) ro.observe(containerRef.current)

    window.addEventListener('resize', updateSize)
    return () => {
      window.removeEventListener('resize', updateSize)
      ro.disconnect()
    }
  }, [currentSlide, isFullscreen])

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, slides.length - 1))
  }, [slides.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only listen if we are focused or fullscreen?
      // Ideally yes, but for now let's keep global listener when component is mounted
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        nextSlide()
      } else if (e.key === 'ArrowLeft') {
        prevSlide()
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          // onExit() // Optional: Esc in windowed mode exits?
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide, onExit])

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If Play button is clicked, it stops propagation, so this only fires for container bg
    if (isFullscreen) {
      const { clientWidth } = e.currentTarget
      // clientWidth is unreliable if letterboxed? No, event target is container.
      // e.nativeEvent.offsetX is relative to target (container).
      const x = e.nativeEvent.offsetX
      // Left 30% -> Prev
      if (x < clientWidth * 0.3) {
        prevSlide()
      } else {
        nextSlide()
      }
    } else {
      // Windowed mode: Click background -> Next? Or do nothing?
      // "Thumbnail state" -> maybe just next slide preview?
      // Or maybe trigger fullscreen?
      // User: "start button in thumbnail state to maximize".
      // Let's stick to simple "Next" for background click in windowed mode
      // BUT Play button is the primary action.
      nextSlide()
    }
  }

  if (!currentSlide) return null

  // Center stage
  const stageW = (currentSlide.w || 297) * scale
  const stageH = (currentSlide.h || 210) * scale

  const stageX = (dimensions.w - stageW) / 2
  const stageY = (dimensions.h - stageH) / 2

  return (
    <div
      ref={containerRef}
      className={cn(
        'bg-black flex items-center justify-center relative overflow-hidden group outline-none',
        isFullscreen ? 'fixed inset-0 z-[9999]' : 'w-full h-full',
        className
      )}
      onClick={handleContainerClick}
      tabIndex={0}
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
          {currentNodes.map((node) => (
            <CanvasElementRenderer
              key={node.id}
              element={node}
              isSelected={false}
              allElements={currentNodes}
              stageScale={scale}
              onSelect={() => {}}
              onChange={() => {}}
              readOnly={true}
            />
          ))}
        </Layer>
      </Stage>

      {/* Top Right Controls */}
      <div
        className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
        onClick={(e) => e.stopPropagation()}
      >
        {isFullscreen ? (
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-black/50 text-white rounded-full hover:bg-white/20"
            title="Exit Fullscreen"
          >
            <Minimize size={20} />
          </button>
        ) : (
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-black/50 text-white rounded-full hover:bg-white/20"
            title="Enter Fullscreen"
          >
            <Maximize size={20} />
          </button>
        )}
        {/* On Exit: only if not fullscreen? Or always? */}
        {/* User seems to want Exit from component entirely */}
        <button
          onClick={onExit}
          className="p-2 bg-black/50 text-white rounded-full hover:bg-white/20 hover:text-red-400"
          title="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Floating Controls (Bottom) */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-2.5 rounded-full border border-white/10 z-20 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={prevSlide}
          className="text-white hover:text-primary transition-colors disabled:opacity-30"
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={24} />
        </button>
        <span className="text-white text-sm font-medium min-w-[3rem] text-center select-none font-mono">
          {currentIndex + 1} / {slides.length}
        </span>
        <button
          onClick={nextSlide}
          className="text-white hover:text-primary transition-colors disabled:opacity-30"
          disabled={currentIndex === slides.length - 1}
        >
          <ChevronRight size={24} />
        </button>

        <div className="w-px h-4 bg-white/20 mx-1" />

        <button
          onClick={toggleFullscreen}
          className="text-white hover:text-primary transition-colors"
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      {/* Start / Play Overlay for Windowed Mode */}
      {!isFullscreen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors hover:bg-black/20">
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleFullscreen()
            }}
            className="bg-primary/90 hover:bg-primary text-white p-4 rounded-full shadow-2xl scale-100 hover:scale-110 transition-all cursor-pointer"
            title="Start Slideshow"
          >
            <Play size={32} fill="currentColor" />
          </button>
        </div>
      )}
    </div>
  )
}
