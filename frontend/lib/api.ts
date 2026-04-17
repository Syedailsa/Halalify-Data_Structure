export interface ProductPayload {
  canonical_id: string
  norm_name: string
  category_l1: string
  category_l2: string
  halal_status: string
  sold_in: string[]
  marketplace: string[]
  companies: string[]
  cert_bodies: string[]
  cert_expiry: string | null
  cert_issue: string | null
  source_count: number
  health_info: string[]
  typical_uses: string[]
  source_ids: string[]
  source_files: string[]
  fda_numbers: string[]
  barcodes: string[]
  company_contact: string[]
}

export interface ProductResult {
  score: number
  payload: ProductPayload
}

export interface QuerySummary {
  company: string
  halal: number
  haram: number
  mushbooh: number
}

export interface HalalQueryResponse {
  success: boolean
  query: string
  classified?: {
    type: number
    company: string | null
    product: string | null
    category: string | null
    e_code: string | null
  }
  resolvedCompany?: string | null
  resolvedCategory?: string | null
  fuzzyWarning?: string | null
  summary?: QuerySummary | null
  results?: ProductResult[]
  formatted?: string | null
  topScore?: number
  threshold?: number
  found?: boolean
  notInDatabase?: boolean
  webResults?: string | null
  error?: string
}

const API_BASE = "/api"

export async function queryHalal(query: string): Promise<HalalQueryResponse> {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Server error" }))
    return { success: false, query, error: err.error || `HTTP ${res.status}` }
  }

  return res.json()
}
