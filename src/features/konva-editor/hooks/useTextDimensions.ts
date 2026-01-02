import { useCallback } from 'react'
import { calculateTextDimensions, type FontSettings } from '@/features/konva-editor/utils/textUtils'

export const useTextDimensions = () => {
  const calculateDimensions = useCallback((text: string, fontSettings: FontSettings) => {
    return calculateTextDimensions(text, fontSettings)
  }, [])

  return { calculateDimensions }
}
