/**
 * Coordinate utilities
 */

export const ptToPx = (pt: number): number => {
    return Math.round((pt * 96) / 72)
}

export const pxToPt = (px: number): number => {
    return Math.round((px * 72) / 96)
}
