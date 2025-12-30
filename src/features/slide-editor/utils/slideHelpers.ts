/**
 * Slide Editor Helper Utilities
 * Pure functions for slide/master logic - fully testable
 */

import type { Surface, UnifiedNode } from '@/types/canvas'

/**
 * Determines if a surface is a master (not a regular slide)
 * A master has no masterId property set
 */
export function isMasterSurface(surface: Surface | undefined): boolean {
    if (!surface) return false
    // masterId is undefined/null for masters, and not 'master-blank'
    return !surface.masterId && surface.id !== 'master-blank'
}

/**
 * Get the first normal slide ID from surfaces
 */
export function getFirstSlideId(surfaces: Surface[]): string {
    return surfaces.find(s => !!s.masterId)?.id || surfaces[0]?.id || ''
}

/**
 * Get the first master ID (excluding master-blank)
 */
export function getFirstMasterId(surfaces: Surface[]): string | undefined {
    return surfaces.find(s => !s.masterId && s.id !== 'master-blank')?.id
}

/**
 * Process master nodes for display on a slide
 * - Filters out placeholders
 * - Replaces dynamic content (e.g., slide numbers)
 * - Locks all nodes
 */
export function processMasterNodesForDisplay(
    masterNodes: UnifiedNode[],
    pageNumber: number
): UnifiedNode[] {
    return masterNodes
        .filter(n => !n.isPlaceholder)
        .map(n => {
            const node = { ...n, locked: true }

            // Dynamic content replacement
            if (node.t === 'text' && node.dynamicContent === 'slide-number') {
                return { ...node, text: String(pageNumber) }
            }
            return node
        })
}

/**
 * Merge master and slide nodes for display
 * @param isMasterEditMode - Whether editing a master directly
 * @param processedMasterNodes - Master nodes (processed for display)
 * @param currentSurfaceNodes - Nodes on the current surface
 */
export function mergeDisplayNodes(
    isMasterEditMode: boolean,
    processedMasterNodes: UnifiedNode[],
    currentSurfaceNodes: UnifiedNode[]
): UnifiedNode[] {
    if (isMasterEditMode) {
        // Master Edit Mode: Show only master nodes (editable)
        return currentSurfaceNodes
    }
    // Slide Edit Mode: Show master nodes (locked) + slide nodes (editable)
    return [...processedMasterNodes, ...currentSurfaceNodes]
}

/**
 * Calculate page number for a slide
 */
export function getSlidePageNumber(surfaces: Surface[], currentSlideId: string): number {
    const slides = surfaces.filter(s => !!s.masterId)
    const index = slides.findIndex(s => s.id === currentSlideId)
    return index >= 0 ? index + 1 : 1
}

/**
 * Get the target master ID when entering master edit mode
 */
export function getTargetMasterIdForEdit(
    currentSlide: Surface | undefined,
    surfaces: Surface[]
): string | undefined {
    // Try master associated with current slide
    let targetMasterId = currentSlide?.masterId

    // Fallback if no masterId or master-blank
    if (!targetMasterId || targetMasterId === 'master-blank') {
        targetMasterId = getFirstMasterId(surfaces)
    }

    // Verify master exists
    if (targetMasterId && surfaces.find(s => s.id === targetMasterId)) {
        return targetMasterId
    }

    // Last fallback: any master
    return getFirstMasterId(surfaces)
}

/**
 * Get the target slide ID when exiting master edit mode
 */
export function getTargetSlideIdForExit(
    lastSlideId: string | null,
    surfaces: Surface[]
): string {
    return lastSlideId || getFirstSlideId(surfaces)
}
