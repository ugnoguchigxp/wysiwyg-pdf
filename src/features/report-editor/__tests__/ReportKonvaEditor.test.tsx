import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Doc } from '@/features/konva-editor/types'
import { ReportKonvaEditor } from '../ReportKonvaEditor'

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

const mockDoc: Doc = {
    id: 'test-doc',
    v: 1,
    title: 'Test Document',
    unit: 'mm',
    surfaces: [
        {
            id: 'page-1',
            type: 'page',
            w: 800,
            h: 600,
        },
    ],
    nodes: [],
}

describe('ReportKonvaEditor', () => {
    it('renders without crashing', () => {
        // Note: Konva testing often requires more complex setup for canvas interaction.
        // This smoke test primarily ensures the component tree mounts and hooks initialize correctly.
        const { container } = render(
            <ReportKonvaEditor
                templateDoc={mockDoc}
                zoom={1}
                onElementSelect={vi.fn()}
                onTemplateChange={vi.fn()}
            />
        )
        expect(container).toBeDefined()
    })
})
