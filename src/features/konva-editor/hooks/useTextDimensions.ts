import { useCallback } from 'react'
import { calculateTextDimensions, FontSettings } from '@/features/konva-editor/utils/textUtils'

export const useTextDimensions = () => {
    const calculateDimensions = useCallback((text: string, fontSettings: FontSettings) => {
        return calculateTextDimensions(text, fontSettings)
    }, [])

    return { calculateDimensions }
}
