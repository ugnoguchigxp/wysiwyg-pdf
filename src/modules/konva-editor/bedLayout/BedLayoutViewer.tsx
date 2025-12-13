import React from 'react'
import { KonvaViewer } from '../../../components/canvas/KonvaViewer'
import type { IBedElement } from '../../../types/canvas'
import { BedElement } from './elements/BedElement'
import { PaperBackground } from './components/PaperBackground'
import type { BedLayoutDocument } from '../types'
import type { BedStatusData } from '../../bedlayout-dashboard/types'

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
        .filter((el): el is IBedElement => el !== undefined)

    return (
        <KonvaViewer
            elements={elements}
            zoom={zoom}
            paperWidth={paperWidth}
            paperHeight={paperHeight}
            background={<PaperBackground document={document} />}
            renderCustom={(el, commonProps, handleShapeRef) => {
                if (el.type === 'Bed') {
                    const { ref: _ignoredRef, ...propsWithoutRef } = commonProps
                    const bedStatus = dashboardData ? dashboardData[el.id] : undefined
                    return (
                        <BedElement
                            {...propsWithoutRef}
                            element={el as IBedElement}
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
