// import type { IBedElement } from '../konva-editor/types'

export type BedStatusValue = 'free' | 'occupied' | 'cleaning' | 'maintenance'

export interface BedStatusData {
  bedId: string
  patientName?: string
  patientId?: string
  sessionId?: string
  isOccupied: boolean
  status: BedStatusValue
  alerts: string[]
  vitals?: {
    bp?: {
      systolic: number
      diastolic: number
    }
    hr?: number
    // Add other vitals as needed
  }
  customData?: Record<string, unknown>
}

// Keep BedStatus for backward compatibility if needed, or alias it
export type BedStatus = BedStatusData
export interface RoomBed {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

export interface RoomWall {
  id: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  stroke: string
  strokeWidth: number
}

export interface RoomText {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  color: string
}

export interface RoomLayout {
  id: string
  name: string
  width: number
  height: number
  beds: RoomBed[]
  walls: RoomWall[]
  texts: RoomText[]
}

export interface BedDashboardRoom {
  room: RoomLayout
  statuses: BedStatus[]
}
