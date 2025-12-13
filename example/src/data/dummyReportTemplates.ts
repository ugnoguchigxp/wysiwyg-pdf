import type { Doc } from 'wysiwyg-pdf'

export const INVOICE_TEMPLATE: Doc = {
    v: 1,
    id: 'invoice-template',
    title: 'Invoice Template',
    unit: 'pt',
    surfaces: [
        {
            id: 'page-1',
            type: 'page',
            w: 595.28,
            h: 841.89,
            bg: '#ffffff',
            margin: { t: 20, r: 20, b: 20, l: 20 },
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
            fontSize: 24,
            fontWeight: 700,
            fill: '#000000',
            align: 'r',
            x: 400, y: 40, w: 150, h: 30,
        },
        {
            id: 'company-info',
            s: 'page-1',
            t: 'text',
            name: 'Company Info',
            text: 'Acme Corp\n123 Business Rd.\nTech City, TC 90210',
            font: 'Helvetica',
            fontSize: 10,
            fontWeight: 400,
            fill: '#666666',
            align: 'l',
            x: 40, y: 40, w: 200, h: 50,
        },
        {
            id: 'invoice-details',
            s: 'page-1',
            t: 'text',
            name: 'Invoice Details',
            text: 'Invoice #: INV-2024-001\nDate: 2024-12-13',
            font: 'Helvetica',
            fontSize: 10,
            fontWeight: 400,
            fill: '#000000',
            align: 'r',
            x: 400, y: 80, w: 150, h: 40,
        },
        {
            id: 'line-1',
            s: 'page-1',
            t: 'line',
            name: 'Line 1',
            pts: [40, 140, 555, 140], // Adjusted to be below headers based on context (guesswork allowed for dummy data)
            stroke: '#dddddd',
            strokeW: 1,
            arrows: ['none', 'none'],
        },
        {
            id: 'item-header',
            s: 'page-1',
            t: 'text',
            name: 'Item Header',
            text: 'Description                                           Amount',
            font: 'Helvetica',
            fontSize: 10,
            fontWeight: 700,
            fill: '#000000',
            align: 'l',
            x: 40, y: 150, w: 515, h: 20,
        },
        {
            id: 'item-1',
            s: 'page-1',
            t: 'text',
            name: 'Item 1',
            text: 'Web Development Services',
            font: 'Helvetica',
            fontSize: 10,
            fontWeight: 400,
            fill: '#000000',
            align: 'l',
            x: 40, y: 180, w: 400, h: 20,
        },
        {
            id: 'price-1',
            s: 'page-1',
            t: 'text',
            name: 'Price 1',
            text: '$5,000.00',
            font: 'Helvetica',
            fontSize: 10,
            fontWeight: 400,
            fill: '#000000',
            align: 'r',
            x: 455, y: 180, w: 100, h: 20,
        },
        {
            id: 'total-label',
            s: 'page-1',
            t: 'text',
            name: 'Total Label',
            text: 'Total:',
            font: 'Helvetica',
            fontSize: 12,
            fontWeight: 700,
            fill: '#000000',
            align: 'r',
            x: 355, y: 250, w: 100, h: 20,
        },
        {
            id: 'total-amount',
            s: 'page-1',
            t: 'text',
            name: 'Total Amount',
            text: '$5,000.00',
            font: 'Helvetica',
            fontSize: 12,
            fontWeight: 700,
            fill: '#000000',
            align: 'r',
            x: 455, y: 250, w: 100, h: 20,
        }
    ],
}

export const SIGNATURE_TEMPLATE: Doc = {
    v: 1,
    id: 'doc-1',
    title: 'New Template',
    unit: 'pt',
    surfaces: [
        {
            id: 'page-1',
            type: 'page',
            w: 600,
            h: 300,
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
            x: 103.952,
            y: 60.008,
            w: 212.902,
            h: 162.023,
            stroke: '#000000',
            strokeW: 2,
            strokes: [
                [
                    0, 56.008, 2.999, 38.005, 29.986, 0, 27.987, 65.009, 29.986, 79.011,
                    39.982, 89.012, 50.977, 80.011, 68.968, 29.004, 39.982, 149.021, 3.998, 227.032,
                    2.999, 218.03, 10.995, 190.026, 43.98, 121.017, 79.963, 72.01, 99.954, 53.007,
                    111.949, 46.006, 116.946, 69.01, 121.944, 71.01, 149.931, 24.003, 149.931, 67.009,
                    170.921, 62.009, 181.916, 43.006, 168.922, 114.016, 157.927, 144.02, 143.934, 165.023,
                    147.932, 133.019, 173.92, 93.013, 195.91, 70.01, 195.91, 93.013, 209.904, 93.013,
                    220.898, 68.009
                ],
                [
                    208.904, 37.005, 208.904, 37.005
                ],
                [
                    168.922, 27.004, 168.922, 27.004
                ]
            ]
        }
    ]
}
