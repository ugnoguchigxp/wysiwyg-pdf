import React from 'react'
import { KonvaViewer } from '@/components/canvas/KonvaViewer'
import type { WidgetNode } from '@/types/canvas'
import { BedElement } from '@/features/konva-editor/renderers/bed-elements/BedElement'
import { PaperBackground } from './components/PaperBackground'
import type { BedLayoutDocument } from '@/features/konva-editor/types'
import type { BedStatusData } from '@/features/bed-layout-dashboard/types'

interface BedLayoutViewerProps {
    document: BedLayoutDocument
    dashboardData?: Record<string, BedStatusData>
    zoom: number
}

export const BedLayoutViewer: React.FC<BedLayoutViewerProps> = ({ document, dashboardData, zoom }) => {
    // Center the paper
    const paperWidth = document.layout.width
    const paperHeight = document.layout.height

    // Filter out undefined elements and ensure type safety
    const elements = document.elementOrder
        .map((id) => document.elementsById[id])
        .filter((el): el is WidgetNode => el !== undefined) // Assuming we only have WidgetNodes or handle generics? 
    // actually elements can be any UnifiedNode. KonvaViewer handles them.
    // But `elements` passed to KonvaViewer should be UnifiedNode[].

    return (
        <KonvaViewer
            elements={elements}
            zoom={zoom}
            paperWidth={paperWidth}
            paperHeight={paperHeight}
            background={<PaperBackground document={document} />}
            renderCustom={(el, commonProps, handleShapeRef) => {
                if (el.t === 'widget' && el.widget === 'bed') {
                    const { ref: _ignoredRef, ...propsWithoutRef } = commonProps
                    const bedStatus = dashboardData ? dashboardData[el.id] : undefined
                    return (
                        <BedElement
                            {...propsWithoutRef}
                            element={el as WidgetNode}
                            isSelected={false}
                            shapeRef={handleShapeRef}
                            bedStatus={bedStatus}
                        />
                    )
                }
                return null
            }}
        />
    )
}
