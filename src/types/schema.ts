/**
 * Data Schema Definition
 * Defines the structure of data available for binding in the template.
 */

export interface ISchemaField {
  id: string // e.g. 'patient.name'
  type: 'string' | 'number' | 'date' | 'image' | 'array'
  label: string // Display name
  formatOptions?: string[] // List of available format strings
  sampleValue?: unknown // For preview in editor
  validation?: {
    required?: boolean
    maxLength?: number
  }
}

export interface IFieldCategory {
  id: string // e.g. 'patient'
  label: string
  isRepeater: boolean
  fields: ISchemaField[]
}

export interface ISystemVariableDefinition {
  id: string
  label: string
  type: 'date' | 'number' | 'string'
  format?: string
}

export interface IDataSchema {
  id: string
  version: string // SemVer
  locale: 'ja-JP' | 'en-US'
  categories: IFieldCategory[]
  systemVariables?: ISystemVariableDefinition[]
}

/**
 * Adapter Interfaces for Host App
 */
export type PreviewDataAdapter = (schema: IDataSchema) => Promise<Record<string, unknown>>
export type AssetResolver = (assetId: string) => Promise<string>
