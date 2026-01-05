import { useCallback } from 'react'
import { PAGE_SIZES } from '@/constants/pageSizes'
import { SLIDE_LAYOUTS } from '@/features/slide-editor/constants/layouts'
import { SLIDE_TEMPLATES } from '@/features/slide-editor/constants/templates'
import type { Doc, UnifiedNode } from '@/types/canvas'
import { generateUUID } from '@/utils/browser'

interface UseSlideOperationsProps {
  setDoc: (
    doc: Doc | ((prev: Doc) => Doc),
    options?: { saveToHistory?: boolean; force?: boolean }
  ) => void
  currentSlideId: string
  doc: Doc
  setCurrentSlideId: (id: string) => void
  isMasterEditMode: boolean
}

export const useSlideOperations = ({
  setDoc,
  currentSlideId,
  doc,
  setCurrentSlideId,
  isMasterEditMode,
}: UseSlideOperationsProps) => {
  const currentSlide = doc.surfaces.find((s) => s.id === currentSlideId)

  // Add Slide with Layout
  const handleAddSlide = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: layoutId matches LayoutType
    (layoutId: any) => {
      // layoutId is LayoutType
      const layout = SLIDE_LAYOUTS.find((l) => l.id === layoutId) || SLIDE_LAYOUTS[0] // fallback

      // Helper to generate nodes for a surface
      const generateLayoutNodes = (surfaceId: string, w: number, h: number) => {
        return layout.generateNodes(surfaceId, w, h) || []
      }

      if (isMasterEditMode) {
        // Create a NEW MASTER
        const newMasterId = `master-${generateUUID()}`
        const newSurface = {
          id: newMasterId,
          type: 'slide',
          w: currentSlide?.w || PAGE_SIZES.A4_LANDSCAPE.w,
          h: currentSlide?.h || PAGE_SIZES.A4_LANDSCAPE.h,
          bg: '#ffffff',
          // masterId: undefined (It is a master)
        } as const

        const newNodes = generateLayoutNodes(newMasterId, newSurface.w, newSurface.h)

        setDoc((prev) => ({
          ...prev,
          surfaces: [newSurface, ...prev.surfaces],
          nodes: [...prev.nodes, ...newNodes],
        }))
        setCurrentSlideId(newMasterId)
      } else {
        // Create a Normal Slide
        const newSlideId = `slide-${generateUUID()}`
        const targetMasterId = `master-${layoutId}`
        const masterSurface = doc.surfaces.find((s) => s.id === targetMasterId)
        const safeMasterId = masterSurface ? targetMasterId : 'master-blank'

        const newSurface = {
          id: newSlideId,
          type: 'slide',
          w: currentSlide?.w || PAGE_SIZES.A4_LANDSCAPE.w,
          h: currentSlide?.h || PAGE_SIZES.A4_LANDSCAPE.h,
          bg: undefined,
          masterId: safeMasterId,
        } as const

        // Generate Nodes: Clone Placeholders from Master
        let newNodes: UnifiedNode[] = []
        if (masterSurface) {
          const masterPlaceholders = doc.nodes.filter(
            (n) => n.s === masterSurface.id && n.isPlaceholder
          )
          newNodes = masterPlaceholders.map((n) => ({
            ...n,
            id: `${n.t}-${generateUUID()}`,
            s: newSlideId,
            isPlaceholder: undefined,
            locked: false,
          }))
        }

        setDoc(
          (prev) => {
            const currentIndex = prev.surfaces.findIndex((s) => s.id === currentSlideId)
            const insertIndex = currentIndex >= 0 ? currentIndex + 1 : prev.surfaces.length

            const newSurfaces = [...prev.surfaces]
            newSurfaces.splice(insertIndex, 0, newSurface)

            return {
              ...prev,
              surfaces: newSurfaces,
              nodes: [...prev.nodes, ...newNodes],
            }
          },
          { saveToHistory: true }
        ) // Assuming setDoc handles 2nd arg if it's from useHistory

        setCurrentSlideId(newSlideId)
      }
    },
    [
      currentSlideId,
      currentSlide,
      isMasterEditMode,
      setDoc,
      doc.surfaces,
      doc.nodes,
      setCurrentSlideId,
    ]
  )

  const handleSelectTemplate = useCallback(
    (templateId: string) => {
      const template = SLIDE_TEMPLATES.find((t) => t.id === templateId)
      if (!template) return

      setDoc((prev) => {
        const masterSurfaces = prev.surfaces.filter((s) => !s.masterId && s.type === 'slide')

        // 1. Update Surfaces (Background)
        const newSurfaces = prev.surfaces.map((s) => {
          if (masterSurfaces.find((m) => m.id === s.id)) {
            return { ...s, bg: template.master.bg }
          }
          return s
        })

        // 2. Update Nodes
        let newNodes = prev.nodes
          .filter((n) => {
            if (!masterSurfaces.find((m) => m.id === n.s)) return true
            if (n.isPlaceholder) return true
            return false
          })
          .map((n) => {
            if (n.isPlaceholder && n.t === 'text' && template.master.textColor) {
              return { ...n, fill: template.master.textColor }
            }
            return n
          })

        // Add Template Nodes for each Master
        masterSurfaces.forEach((master) => {
          const templateNodesForMaster = template.master.nodes.map((n) => ({
            ...n,
            id: `${n.t}-${generateUUID()}`,
            s: master.id,
          }))
          newNodes = [...newNodes, ...templateNodesForMaster]
        })

        return {
          ...prev,
          surfaces: newSurfaces,
          nodes: newNodes,
        }
      })
    },
    [setDoc]
  )

  return {
    handleAddSlide,
    handleSelectTemplate,
  }
}
