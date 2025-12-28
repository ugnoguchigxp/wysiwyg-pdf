export interface PageSize {
    id: string
    name: string
    w: number // mm
    h: number // mm
}

export const PAGE_SIZES: Record<string, PageSize> = {
    A4_LANDSCAPE: {
        id: 'a4_landscape',
        name: 'A4 Landscape',
        w: 297,
        h: 210,
    },
    A4_PORTRAIT: {
        id: 'a4_portrait',
        name: 'A4 Portrait',
        w: 210,
        h: 297,
    },
} as const
