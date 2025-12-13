export interface BedStatusData {
    status: 'idle' | 'active' | 'warning' | 'alarm'
    patientName?: string
    vitals?: {
        bp?: {
            systolic: number
            diastolic: number
        }
        hr?: number
        temp?: number
    }
    alerts?: string[]
    isOccupied?: boolean
    customData?: Record<string, unknown>
}
