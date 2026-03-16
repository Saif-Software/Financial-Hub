// ══════════════════════════════════════════════════════════
// lib/api.ts  —  FinancialsHub API Service
// ══════════════════════════════════════════════════════════

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:7184/api'

// ── Helper: fetch wrapper ───────────────────────────────
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error?.message ?? `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ══════════════════════════════════════════════════════════
// ── Types
// ══════════════════════════════════════════════════════════

export interface MediaDto {
  id: number
  filePath: string | null
  uploadedAt: string | null
}

export interface TransactionRecordDto {
  id: number
  transactionDate: string | null
  amount: number | null
  description: string | null
  categoryName: string | null
  categoryId: number | null
  transactionReportId: number | null
  attachments: MediaDto[]
}

export interface TransactionReportListItemDto {
  id: number
  reportName: string | null
  notes: string | null
  creatorNameEn: string | null
  creatorNameAr: string | null
  creatorAccountId: number | null
  categoryName: string | null
  categoryId: number | null
  totalAmount: number
  lastTransactionDate: string | null  // "YYYY-MM-DD"
  createdAt: string | null            // "YYYY-MM-DDTHH:mm:ss" — للفلترة بالتاريخ
}

export interface TransactionReportDto {
  id: number
  reportName: string | null
  notes: string | null
  creatorNameEn: string | null
  creatorNameAr: string | null
  creatorAccountId: number | null
  categoryName: string | null
  categoryId: number | null
  totalAmount: number
  createdAt: string | null
  attachments: MediaDto[]
  transactionRecords: TransactionRecordDto[]
}

// ── Payloads ────────────────────────────────────────────

export interface CreateReportPayload {
  reportName: string
  notes?: string
  creatorAccountId: number
  categoryId?: number
}

export interface UpdateReportPayload {
  reportName?: string
  notes?: string
  categoryId?: number
}

export interface CreateRecordPayload {
  transactionDate?: string
  transactionReportId: number
  categoryId?: number
  amount?: number
  description?: string
}

export interface UpdateRecordPayload {
  transactionDate?: string
  categoryId?: number
  amount?: number
  description?: string
}

// ══════════════════════════════════════════════════════════
// ── Transaction Report Endpoints
// ══════════════════════════════════════════════════════════

export const reportsApi = {
  getAll(): Promise<TransactionReportListItemDto[]> {
    return request('TransactionReport')
  },
  getById(id: number): Promise<TransactionReportDto> {
    return request(`TransactionReport/${id}`)
  },
  create(payload: CreateReportPayload): Promise<TransactionReportDto> {
    return request('TransactionReport', { method: 'POST', body: JSON.stringify(payload) })
  },
  update(id: number, payload: UpdateReportPayload): Promise<TransactionReportDto> {
    return request(`TransactionReport/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  delete(id: number): Promise<void> {
    return request(`TransactionReport/${id}`, { method: 'DELETE' })
  },
}

// ══════════════════════════════════════════════════════════
// ── Transaction Record Endpoints
// ══════════════════════════════════════════════════════════

export const recordsApi = {
  getAll(reportId: number): Promise<TransactionRecordDto[]> {
    return request(`TransactionReport/${reportId}/records`)
  },
  create(reportId: number, payload: CreateRecordPayload): Promise<TransactionRecordDto> {
    return request(`TransactionReport/${reportId}/records`, { method: 'POST', body: JSON.stringify(payload) })
  },
  update(reportId: number, recordId: number, payload: UpdateRecordPayload): Promise<TransactionRecordDto> {
    return request(`TransactionReport/${reportId}/records/${recordId}`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  delete(reportId: number, recordId: number): Promise<void> {
    return request(`TransactionReport/${reportId}/records/${recordId}`, { method: 'DELETE' })
  },
}

// ══════════════════════════════════════════════════════════
// ── Attachment Endpoints
// ══════════════════════════════════════════════════════════

export const attachmentsApi = {
  upload(reportId: number, recordId: number, file: File): Promise<MediaDto> {
    const form = new FormData()
    form.append('file', file)
    return fetch(`${BASE_URL}/TransactionReport/${reportId}/records/${recordId}/attachments`, {
      method: 'POST',
      body: form,
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(err?.message ?? `HTTP ${res.status}`)
      }
      return res.json()
    })
  },
  delete(mediaId: number): Promise<void> {
    return request(`TransactionReport/attachments/${mediaId}`, { method: 'DELETE' })
  },
  fullUrl(filePath: string): string {
    const backendBase = (process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:7184/api').replace('/api', '')
    return `${backendBase}${filePath}`
  },
}
