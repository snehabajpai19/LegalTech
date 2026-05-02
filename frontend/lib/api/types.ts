export interface AuthenticatedUser {
  _id: string
  email: string
  google_id: string
  name?: string | null
  picture?: string | null
  is_active: boolean
  created_at: string
  last_login_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: "bearer"
  user: AuthenticatedUser
}

export interface ChatQueryRequest {
  query: string
  document_id?: string | null
}

export interface ChatQueryResponse {
  answer: string
  vector_index_ready: boolean
}

export interface ChatHistoryItem {
  _id: string
  user_id: string
  document_id?: string | null
  message: string
  answer: string
  mode: string
  created_at: string
  timestamp: string
}

export interface DocumentSummaryResponse {
  document_id: string
  summary: string
  filename?: string | null
  source_type: "pdf" | "ocr" | string
  vector_index_ready: boolean
}

export interface StoredDocument {
  _id: string
  user_id: string
  created_at: string
  original_text?: string | null
  summarized_text?: string | null
  generated_text?: string | null
  template_id?: string | null
  template_version?: string | null
  inputs_hash?: string | null
  metadata: Record<string, unknown>
  source_type?: string | null
  filename?: string | null
  retrieved_context_count?: number | null
}

export interface TemplateField {
  name: string
  label: string
  type: string
  required: boolean
  placeholder?: string | null
  description?: string | null
  options?: string[] | null
  is_pii?: boolean
}

export interface DocumentTemplate {
  _id: string
  name: string
  description: string
  category: string
  fields: TemplateField[]
  template_text: string
  version: string
  created_at: string
  updated_at: string
}

export interface DocumentTemplatePayload {
  name: string
  description: string
  category: string
  fields: TemplateField[]
  template_text: string
  version?: string
}

export interface GeneratorRenderRequest {
  template_id: string
  inputs: Record<string, unknown>
  output_format?: string
}

export interface GeneratorRenderResponse {
  document_id: string
  template_id: string
  template_name: string
  template_version: string
  generated_text: string
  generated_at: string
  metadata: Record<string, unknown>
}

export interface LegalSearchRequest {
  query: string
  top_k?: number
}

export interface LegalSearchHit {
  content: string
  metadata: Record<string, unknown>
  distance: number
}

export interface LegalSearchResponse {
  query: string
  results: LegalSearchHit[]
  index_ready: boolean
}

export interface ApiErrorShape {
  detail?: string | Array<{ msg?: string; loc?: string[] }>
}
