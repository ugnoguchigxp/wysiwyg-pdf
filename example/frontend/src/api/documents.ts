export type DocumentType = 'report' | 'bed-layout' | 'signature' | 'mindmap' | 'slide' | 'slide-master'

export interface DocumentSummary {
  id: string
  user: string
  type: DocumentType
  title: string
  createdAt: number
  updatedAt: number
}

export interface DocumentDetail extends DocumentSummary {
  payload: unknown
}

export interface DocumentListResponse {
  items: DocumentSummary[]
}

export interface SaveDocumentInput {
  user: string
  type: DocumentType
  title: string
  payload: unknown
  force?: boolean
}

export type SaveDocumentResult =
  | { status: 'saved'; document: DocumentDetail }
  | { status: 'exists'; document: DocumentSummary }

const DEFAULT_BASE_URL = '/api'
// Force using proxy to avoid stale environment variables requiring restart
const BASE_URL = DEFAULT_BASE_URL
// const RAW_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL
// const BASE_URL = RAW_BASE_URL || DEFAULT_BASE_URL

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return
    query.set(key, String(value))
  })
  return query.toString()
}

const fetchWithFallback = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  try {
    return await fetch(input, init)
  } catch (error) {
    if (BASE_URL === DEFAULT_BASE_URL) throw error
    const fallbackUrl = String(input).replace(BASE_URL, DEFAULT_BASE_URL)
    return fetch(fallbackUrl, init)
  }
}

export const listDocuments = async (params: {
  user: string
  type?: DocumentType
  q?: string
  limit?: number
  offset?: number
}): Promise<DocumentListResponse> => {
  const query = buildQuery(params)
  const res = await fetchWithFallback(`${BASE_URL}/documents?${query}`)
  if (!res.ok) {
    throw new Error(`Failed to list documents: ${res.status}`)
  }
  return res.json()
}

export const getDocument = async (id: string, user?: string): Promise<DocumentDetail> => {
  const query = buildQuery({ user })
  const url = query ? `${BASE_URL}/documents/${id}?${query}` : `${BASE_URL}/documents/${id}`
  const res = await fetchWithFallback(url)
  if (!res.ok) {
    throw new Error(`Failed to load document: ${res.status}`)
  }
  return res.json()
}

export const saveDocument = async (input: SaveDocumentInput): Promise<SaveDocumentResult> => {
  const res = await fetchWithFallback(`${BASE_URL}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (res.status === 409) {
    const data = await res.json()
    return { status: 'exists', document: data.document }
  }

  if (!res.ok) {
    throw new Error(`Failed to save document: ${res.status}`)
  }

  const document = await res.json()
  return { status: 'saved', document }
}

export const importExcel = async (file: File): Promise<{ id: string; title: string }> => {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetchWithFallback(`${BASE_URL}/excel/import`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error')
    throw new Error(`Failed to import Excel: ${res.status} ${errorText}`)
  }

  return res.json()
}
