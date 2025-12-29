import { db } from "./db";
import { documents } from "./schema";
import { eq, and } from "drizzle-orm";

// --- Helpers ---
const pxToMm = (px: number) => (px * 25.4) / 96;
const ptToMm = (pt: number) => (pt * 25.4) / 72;
const id = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

// --- Data: Bed Layout ---
const createBed = (x: number, y: number, label: string, rotation = 0) => ({
    id: id('bed'),
    t: 'widget',
    widget: 'bed',
    s: 'layout',
    x: pxToMm(x),
    y: pxToMm(y),
    w: pxToMm(60),
    h: pxToMm(120),
    r: rotation,
    name: label,
    opacity: 1,
    locked: true,
    data: { bedType: 'standard' }
});

const createWall = (x1: number, y1: number, x2: number, y2: number) => ({
    id: id('wall'),
    t: 'line',
    s: 'layout',
    pts: [pxToMm(x1), pxToMm(y1), pxToMm(x2), pxToMm(y2)],
    stroke: '#334155',
    strokeW: pxToMm(4),
    arrows: ['none', 'none'],
    locked: true
});

const createText = (x: number, y: number, text: string, fontSize = 14) => ({
    id: id('text'),
    t: 'text',
    s: 'layout',
    text,
    font: 'Meiryo',
    fontSize: pxToMm(fontSize),
    fontWeight: 700,
    fill: '#0f172a',
    x: pxToMm(x),
    y: pxToMm(y),
    w: pxToMm(200),
    h: pxToMm(30),
    align: 'c',
    r: 0,
    locked: true
});

const beds = [
    createBed(50, 100, 'b1'),
    createBed(150, 100, 'b2'),
    createBed(250, 100, 'b3'),
    createBed(50, 400, 'b4'),
    createBed(150, 400, 'b5'),
    createBed(250, 400, 'b6'),
];

const walls = [
    createWall(20, 20, 780, 20),
    createWall(20, 20, 20, 580),
    createWall(780, 20, 780, 580),
    createWall(20, 580, 780, 580),
    createWall(350, 20, 350, 200),
    createWall(350, 400, 350, 580),
];

const labels = [
    createText(300, 30, 'ICU Ward A', 24),
    createText(400, 250, 'Nurse Station', 16),
];

const BED_LAYOUT_DOC = {
    v: 1,
    id: 'demo-icu-ward',
    title: 'ICU Ward A',
    unit: 'mm',
    surfaces: [
        { id: 'layout', type: 'canvas', w: pxToMm(800), h: pxToMm(600) },
    ],
    nodes: [...walls, ...beds, ...labels],
};

// --- Data: Invoice ---
const INVOICE_DOC = {
    v: 1,
    id: 'invoice-template',
    title: 'Invoice Template',
    unit: 'mm',
    surfaces: [
        {
            id: 'page-1',
            type: 'page',
            w: ptToMm(595.28),
            h: ptToMm(841.89),
            bg: '#ffffff',
            margin: { t: ptToMm(20), r: ptToMm(20), b: ptToMm(20), l: ptToMm(20) },
        },
    ],
    nodes: [
        {
            id: 'title',
            s: 'page-1',
            t: 'text',
            name: 'Title',
            text: 'INVOICE',
            font: 'Helvetica',
            fontSize: ptToMm(24),
            fontWeight: 700,
            fill: '#000000',
            align: 'r',
            x: ptToMm(400), y: ptToMm(40), w: ptToMm(150), h: ptToMm(30),
        },
        {
            id: 'company-info',
            s: 'page-1',
            t: 'text',
            name: 'Company Info',
            text: 'Acme Corp\n123 Business Rd.\nTech City, TC 90210',
            font: 'Helvetica',
            fontSize: ptToMm(10),
            fontWeight: 400,
            fill: '#666666',
            align: 'l',
            x: ptToMm(40), y: ptToMm(40), w: ptToMm(200), h: ptToMm(50),
        },
        {
            id: 'invoice-details',
            s: 'page-1',
            t: 'text',
            name: 'Invoice Details',
            text: 'Invoice #: INV-2024-001\nDate: 2024-12-13',
            font: 'Helvetica',
            fontSize: ptToMm(10),
            fontWeight: 400,
            fill: '#000000',
            align: 'r',
            x: ptToMm(400), y: ptToMm(80), w: ptToMm(150), h: ptToMm(40),
        },
        {
            id: 'line-1',
            s: 'page-1',
            t: 'line',
            name: 'Line 1',
            pts: [ptToMm(40), ptToMm(140), ptToMm(555), ptToMm(140)],
            stroke: '#dddddd',
            strokeW: ptToMm(1),
            arrows: ['none', 'none'],
        },
        {
            id: 'item-header',
            s: 'page-1',
            t: 'text',
            name: 'Item Header',
            text: 'Description                                           Amount',
            font: 'Helvetica',
            fontSize: ptToMm(10),
            fontWeight: 700,
            fill: '#000000',
            align: 'l',
            x: ptToMm(40), y: ptToMm(150), w: ptToMm(515), h: ptToMm(20),
        },
        {
            id: 'item-1',
            s: 'page-1',
            t: 'text',
            name: 'Item 1',
            text: 'Web Development Services',
            font: 'Helvetica',
            fontSize: ptToMm(10),
            fontWeight: 400,
            fill: '#000000',
            align: 'l',
            x: ptToMm(40), y: ptToMm(180), w: ptToMm(400), h: ptToMm(20),
        },
        {
            id: 'price-1',
            s: 'page-1',
            t: 'text',
            name: 'Price 1',
            text: '$5,000.00',
            font: 'Helvetica',
            fontSize: ptToMm(10),
            fontWeight: 400,
            fill: '#000000',
            align: 'r',
            x: ptToMm(455), y: ptToMm(180), w: ptToMm(100), h: ptToMm(20),
        },
        {
            id: 'total-label',
            s: 'page-1',
            t: 'text',
            name: 'Total Label',
            text: 'Total:',
            font: 'Helvetica',
            fontSize: ptToMm(12),
            fontWeight: 700,
            fill: '#000000',
            align: 'r',
            x: ptToMm(355), y: ptToMm(250), w: ptToMm(100), h: ptToMm(20),
        },
        {
            id: 'total-amount',
            s: 'page-1',
            t: 'text',
            name: 'Total Amount',
            text: '$5,000.00',
            font: 'Helvetica',
            fontSize: ptToMm(12),
            fontWeight: 700,
            fill: '#000000',
            align: 'r',
            x: ptToMm(455), y: ptToMm(250), w: ptToMm(100), h: ptToMm(20),
        }
    ],
};

// --- Data: Signature ---
const SIGNATURE_DOC = {
    v: 1,
    id: 'doc-1', // Consider changing to unique ID like signature-demo
    title: 'Signature Document',
    unit: 'mm',
    surfaces: [
        {
            id: 'page-1',
            type: 'page',
            w: ptToMm(600),
            h: ptToMm(300),
            bg: '#ffffff',
            margin: { t: 0, r: 0, b: 0, l: 0 },
        }
    ],
    nodes: [
        {
            id: 'sig-3bc9c133-4c00-449d-a640-69589cd4c1f3',
            s: 'page-1',
            t: 'signature',
            name: 'Signature',
            x: ptToMm(103.952),
            y: ptToMm(60.008),
            w: ptToMm(212.902),
            h: ptToMm(162.023),
            stroke: '#000000',
            strokeW: ptToMm(2),
            strokes: [
                [
                    ptToMm(0), ptToMm(56.008), ptToMm(2.999), ptToMm(38.005), ptToMm(29.986), ptToMm(0), ptToMm(27.987), ptToMm(65.009), ptToMm(29.986), ptToMm(79.011),
                    ptToMm(39.982), ptToMm(89.012), ptToMm(50.977), ptToMm(80.011), ptToMm(68.968), ptToMm(29.004), ptToMm(39.982), ptToMm(149.021), ptToMm(3.998), ptToMm(227.032),
                    ptToMm(2.999), ptToMm(218.03), ptToMm(10.995), ptToMm(190.026), ptToMm(43.98), ptToMm(121.017), ptToMm(79.963), ptToMm(72.01), ptToMm(99.954), ptToMm(53.007),
                    ptToMm(111.949), ptToMm(46.006), ptToMm(116.946), ptToMm(69.01), ptToMm(121.944), ptToMm(71.01), ptToMm(149.931), ptToMm(24.003), ptToMm(149.931), ptToMm(67.009),
                    ptToMm(170.921), ptToMm(62.009), ptToMm(181.916), ptToMm(43.006), ptToMm(168.922), ptToMm(114.016), ptToMm(157.927), ptToMm(144.02), ptToMm(143.934), ptToMm(165.023),
                    ptToMm(147.932), ptToMm(133.019), ptToMm(173.92), ptToMm(93.013), ptToMm(195.91), ptToMm(70.01), ptToMm(195.91), ptToMm(93.013), ptToMm(209.904), ptToMm(93.013),
                    ptToMm(220.898), ptToMm(68.009)
                ],
                [
                    ptToMm(208.904), ptToMm(37.005), ptToMm(208.904), ptToMm(37.005)
                ],
                [
                    ptToMm(168.922), ptToMm(27.004), ptToMm(168.922), ptToMm(27.004)
                ]
            ]
        }
    ]
};

// --- Data: Slides ---
const SLIDE_DOC = {
    v: 1,
    id: 'slide-demo',
    title: 'Presentation Demo',
    unit: 'mm',
    surfaces: [
        { id: 's1', type: 'slide', w: 297, h: 210, bg: '#ffffff' },
        { id: 's2', type: 'slide', w: 297, h: 210, bg: '#f0f9ff' },
    ],
    nodes: [
        { id: 't1', t: 'text', s: 's1', x: 20, y: 80, w: 257, h: 30, text: 'Welcome to Slide Viewer', fontSize: 16, align: 'c', fill: '#000000' },
        { id: 't2', t: 'text', s: 's1', x: 20, y: 120, w: 257, h: 20, text: 'Click next to see more', fontSize: 10, align: 'c', fill: '#666666' },
        { id: 't3', t: 'text', s: 's2', x: 20, y: 90, w: 257, h: 30, text: 'Slide 2: Features', fontSize: 14, align: 'c', fill: '#0369a1' },
    ]
};

// --- Seed Function ---
export const seed = () => {
    const user = "anonymous";
    const now = Date.now();

    const items = [
        { type: 'bed-layout', title: BED_LAYOUT_DOC.title, payload: BED_LAYOUT_DOC },
        { type: 'report', title: INVOICE_DOC.title, payload: INVOICE_DOC },
        { type: 'signature', title: SIGNATURE_DOC.title, payload: SIGNATURE_DOC },
        { type: 'slide', title: SLIDE_DOC.title, payload: SLIDE_DOC },
    ];

    console.log("Seeding database...");

    for (const item of items) {
        const existing = db
            .select()
            .from(documents)
            .where(and(eq(documents.user, user), eq(documents.title, item.title)))
            .get();

        if (!existing) {
            console.log(`Inserting ${item.title}...`);
            db.insert(documents).values({
                id: crypto.randomUUID(),
                user,
                type: item.type,
                title: item.title,
                payload: JSON.stringify(item.payload),
                createdAt: now,
                updatedAt: now,
            }).run();
        } else {
            // Optional: Update if exists to ensure dummy data is fresh?
            // For now, let's just skip if exists to respect user changes
            console.log(`Skipping ${item.title} (already exists)`);
        }
    }

    console.log("Seeding complete.");
};
