import type { BedLayoutDocument } from 'wysiwyg-pdf'
import type { BedStatusData } from 'wysiwyg-pdf/dist/modules/konva-editor/bedlayout-dashboard/types'

// Helper to create IDs
const id = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`

// Helper to create Bed Elements
const createBed = (x: number, y: number, label: string, rotation = 0) => ({
    id: id('bed'),
    type: 'Bed' as const,
    box: { x, y, width: 60, height: 120 },
    rotation,
    label,
    bedType: 'standard',
    opacity: 1,
    locked: true
})

// Helper to create Walls/Lines
const createWall = (x1: number, y1: number, x2: number, y2: number) => ({
    id: id('wall'),
    type: 'Line' as const,
    startPoint: { x: x1, y: y1 },
    endPoint: { x: x2, y: y2 },
    stroke: { color: '#334155', width: 4 }, // Slate-700
    startArrow: 'none',
    endArrow: 'none',
    locked: true
})

// Helper to create Text
const createText = (x: number, y: number, text: string, fontSize = 14) => ({
    id: id('text'),
    type: 'Text' as const,
    text,
    font: { family: 'Meiryo', size: fontSize, weight: 700 },
    color: '#0f172a', // Slate-900
    box: { x, y, width: 200, height: 30 },
    align: 'center',
    rotation: 0,
    locked: true
})

// Mock Layout: ICU Ward A
// 6 Beds, central nurse station
const beds = [
    createBed(50, 100, 'A-01'),
    createBed(150, 100, 'A-02'),
    createBed(250, 100, 'A-03'),
    createBed(50, 400, 'A-04'),
    createBed(150, 400, 'A-05'),
    createBed(250, 400, 'A-06'),
]

const walls = [
    createWall(20, 20, 780, 20),   // Top
    createWall(20, 20, 20, 580),   // Left
    createWall(780, 20, 780, 580), // Right
    createWall(20, 580, 780, 580), // Bottom
    createWall(350, 20, 350, 200), // Partition 1
    createWall(350, 400, 350, 580), // Partition 2
]

const labels = [
    createText(300, 30, 'ICU Ward A', 24),
    createText(400, 250, 'Nurse Station', 16),
]

// Assemble Document
export const dummyBedLayout: BedLayoutDocument = {
    id: 'demo-icu-ward',
    type: 'bed_layout',
    name: 'ICU Ward A',
    layout: {
        mode: 'landscape',
        width: 800,
        height: 600,
    },
    elementsById: {},
    elementOrder: [],
}

// Populate elements
const allElements = [...walls, ...beds, ...labels]
allElements.forEach(el => {
    dummyBedLayout.elementsById[el.id] = el as any
    dummyBedLayout.elementOrder.push(el.id)
})


// Dashboard Data
export const dummyDashboardData: Record<string, BedStatusData> = {}

// Bed 1: Critical (Alarm)
dummyDashboardData[beds[0].id] = {
    status: 'alarm',
    patientName: 'Yamada Taro',
    vitals: {
        bp: { systolic: 180, diastolic: 110 },
        hr: 120,
        temp: 38.5
    },
    alerts: ['High BP', 'Tachycardia'],
    isOccupied: true,
}

// Bed 2: Stable (Active)
dummyDashboardData[beds[1].id] = {
    status: 'active',
    patientName: 'Suzuki Hanako',
    vitals: {
        bp: { systolic: 118, diastolic: 76 },
        hr: 72,
        temp: 36.6
    },
    isOccupied: true,
}

// Bed 3: Empty (Idle)
dummyDashboardData[beds[2].id] = {
    status: 'idle',
    isOccupied: false,
}

// Bed 4: Warning
dummyDashboardData[beds[3].id] = {
    status: 'warning',
    patientName: 'Tanaka Ken',
    vitals: {
        bp: { systolic: 135, diastolic: 88 },
        hr: 95,
        temp: 37.2
    },
    alerts: ['Check IV'],
    isOccupied: true,
}

// Bed 5: Stable
dummyDashboardData[beds[4].id] = {
    status: 'active',
    patientName: 'Sato Jiro',
    vitals: {
        bp: { systolic: 122, diastolic: 80 },
        hr: 68,
        temp: 36.4
    },
    isOccupied: true,
}

// Bed 6: Empty
dummyDashboardData[beds[5].id] = {
    status: 'idle',
    isOccupied: false,
}
