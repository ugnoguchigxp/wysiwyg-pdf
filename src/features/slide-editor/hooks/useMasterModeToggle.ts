/**
 * useMasterModeToggle Hook
 * Manages switching between slide and master edit modes
 */

import { useCallback, useRef } from 'react'
import type { Doc, Surface } from '@/types/canvas'
import {
  getFirstMasterId,
  getTargetMasterIdForEdit,
  getTargetSlideIdForExit,
} from '../utils/slideHelpers'

interface UseMasterModeToggleProps {
  currentSlideId: string
  currentSlide: Surface | undefined
  doc: Doc
  isMasterEditMode: boolean
  setCurrentSlideId: (id: string) => void
}

interface UseMasterModeToggleReturn {
  handleToggleMasterEdit: () => void
}

export function useMasterModeToggle({
  currentSlideId,
  currentSlide,
  doc,
  isMasterEditMode,
  setCurrentSlideId,
}: UseMasterModeToggleProps): UseMasterModeToggleReturn {
  const lastSlideIdRef = useRef<string | null>(null)

  const handleToggleMasterEdit = useCallback(() => {
    if (isMasterEditMode) {
      // Exit Master Mode: Return to previous slide or first normal slide
      const targetId = getTargetSlideIdForExit(lastSlideIdRef.current, doc.surfaces)
      console.log('[useMasterModeToggle] Exiting Master Mode. Target ID:', targetId)
      setCurrentSlideId(targetId)
    } else {
      // Enter Master Mode
      lastSlideIdRef.current = currentSlideId

      const targetMasterId = getTargetMasterIdForEdit(currentSlide, doc.surfaces)

      if (targetMasterId) {
        console.log('[useMasterModeToggle] Entering Master Mode. Target Master ID:', targetMasterId)
        setCurrentSlideId(targetMasterId)
      } else {
        // Last ditch: ANY master that isn't blank
        const anyMaster = getFirstMasterId(doc.surfaces)
        if (anyMaster) {
          console.log('[useMasterModeToggle] Falling back to any master:', anyMaster)
          setCurrentSlideId(anyMaster)
        } else {
          console.warn('No master slide found to edit.')
        }
      }
    }
  }, [isMasterEditMode, currentSlideId, currentSlide, doc.surfaces, setCurrentSlideId])

  return {
    handleToggleMasterEdit,
  }
}
