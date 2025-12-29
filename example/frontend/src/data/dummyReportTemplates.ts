import type { Doc } from 'wysiwyg-pdf'

const ptToMm = (pt: number) => (pt * 25.4) / 72

export const INVOICE_TEMPLATE: Doc = {
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
            pts: [ptToMm(40), ptToMm(140), ptToMm(555), ptToMm(140)], // Adjusted to be below headers based on context (guesswork allowed for dummy data)
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
}

export const SIGNATURE_TEMPLATE: Doc = {
    v: 1,
    id: 'doc-1',
    title: 'New Template',
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
}
