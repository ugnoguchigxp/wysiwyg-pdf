import type { BedLayoutDocument, UnifiedNode, TextNode, LineNode, WidgetNode, BedStatusData } from 'wysiwyg-pdf'

// Helper to create IDs
const id = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`

// Helper to create Bed Elements (Unified: WidgetNode)
const createBed = (x: number, y: number, label: string, rotation = 0): WidgetNode => ({
    id: id('bed'),
    t: 'widget',
    widget: 'bed',
    s: 'layout', // Dummy surface ID
    x, y, w: 60, h: 120,
    r: rotation,
    name: label,
    opacity: 1,
    locked: true,
    data: { bedType: 'standard' }
})

// Helper to create Walls/Lines (Unified: LineNode)
const createWall = (x1: number, y1: number, x2: number, y2: number): LineNode => ({
    id: id('wall'),
    t: 'line',
    s: 'layout',
    pts: [x1, y1, x2, y2],
    stroke: '#334155', // Slate-700
    strokeW: 4,
    arrows: ['none', 'none'],
    locked: true
})

// Helper to create Text (Unified: TextNode)
const createText = (x: number, y: number, text: string, fontSize = 14): TextNode => ({
    id: id('text'),
    t: 'text',
    s: 'layout',
    text,
    font: 'Meiryo',
    fontSize: fontSize,
    fontWeight: 700,
    fill: '#0f172a', // Slate-900
    x, y, w: 200, h: 30,
    align: 'c',
    r: 0,
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
    dummyBedLayout.elementsById[el.id] = el as UnifiedNode
    dummyBedLayout.elementOrder.push(el.id)
})


// Dashboard Data
export const dummyDashboardData: Record<string, BedStatusData> = {}

// Bed 1: Critical (Alarm)
dummyDashboardData[beds[0].id] = {
    bedId: beds[0].id,
    status: 'occupied',
    alerts: ['High BP', 'Tachycardia'],
    patientName: 'Yamada Taro',
    vitals: {
        bp: { systolic: 180, diastolic: 110 },
        hr: 120
    },
    isOccupied: true,
}

// Bed 2: Stable (Active)
dummyDashboardData[beds[1].id] = {
    bedId: beds[1].id,
    status: 'occupied',
    alerts: [],
    patientName: 'Suzuki Hanako',
    vitals: {
        bp: { systolic: 118, diastolic: 76 },
        hr: 72
    },
    isOccupied: true,
}

// Bed 3: Empty (Idle)
dummyDashboardData[beds[2].id] = {
    bedId: beds[2].id,
    status: 'free',
    alerts: [],
    isOccupied: false,
}

// Bed 4: Warning
dummyDashboardData[beds[3].id] = {
    bedId: beds[3].id,
    status: 'occupied',
    alerts: ['Check IV'],
    patientName: 'Tanaka Ken',
    vitals: {
        bp: { systolic: 135, diastolic: 88 },
        hr: 95
    },
    isOccupied: true,
}

// Bed 5: Stable
dummyDashboardData[beds[4].id] = {
    bedId: beds[4].id,
    status: 'occupied',
    alerts: [],
    patientName: 'Sato Jiro',
    vitals: {
        bp: { systolic: 122, diastolic: 80 },
        hr: 68
    },
    isOccupied: true,
}

// Bed 6: Empty
dummyDashboardData[beds[5].id] = {
    bedId: beds[5].id,
    status: 'free',
    alerts: [],
    isOccupied: false,
}
