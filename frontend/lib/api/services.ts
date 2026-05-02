import { apiClient } from "./client"
import type {
  AuthResponse,
  AuthenticatedUser,
  ChatQueryRequest,
  ChatQueryResponse,
  ChatHistoryItem,
  DocumentSummaryResponse,
  StoredDocument,
  DocumentTemplate,
  DocumentTemplatePayload,
  GeneratorRenderRequest,
  GeneratorRenderResponse,
  LegalSearchRequest,
  LegalSearchResponse,
} from "./types"

export const authApi = {
  loginWithGoogle: async (idToken: string) => {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/google", {
      id_token: idToken,
    })
    return data
  },
  getCurrentUser: async () => {
    const { data } = await apiClient.get<AuthenticatedUser>("/api/auth/me")
    return data
  },
}

export const chatbotApi = {
  query: async (payload: ChatQueryRequest) => {
    const { data } = await apiClient.post<ChatQueryResponse>("/api/chatbot/query", payload)
    return data
  },
  history: async () => {
    const { data } = await apiClient.get<ChatHistoryItem[]>("/api/chat/history")
    return data
  },
}

export const summarizerApi = {
  uploadPdf: async (file: File) => uploadSummary("/api/summarizer/upload/pdf", file),
  uploadOcr: async (file: File) => uploadSummary("/api/summarizer/upload/ocr", file),
}

async function uploadSummary(url: string, file: File) {
  const formData = new FormData()
  formData.append("file", file)
  const { data } = await apiClient.post<DocumentSummaryResponse>(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export const documentsApi = {
  list: async () => {
    const { data } = await apiClient.get<StoredDocument[]>("/api/documents")
    return data
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<StoredDocument>(`/api/documents/${id}`)
    return data
  },
  delete: async (id: string) => {
    await apiClient.delete(`/api/documents/${id}`)
  },
}

export const templatesApi = {
  list: async (category?: string) => {
    const { data } = await apiClient.get<DocumentTemplate[]>("/api/templates", {
      params: category ? { category } : undefined,
    })
    return data
  },
  create: async (payload: DocumentTemplatePayload) => {
    const { data } = await apiClient.post<DocumentTemplate>("/api/templates", payload)
    return data
  },
  update: async (id: string, payload: Partial<DocumentTemplatePayload>) => {
    const { data } = await apiClient.put<DocumentTemplate>(`/api/templates/${id}`, payload)
    return data
  },
  delete: async (id: string) => {
    await apiClient.delete(`/api/templates/${id}`)
  },
}

export const generatorApi = {
  render: async (payload: GeneratorRenderRequest) => {
    const { data } = await apiClient.post<GeneratorRenderResponse>("/api/generator/render", payload)
    return data
  },
}

export const searchApi = {
  legal: async (payload: LegalSearchRequest) => {
    const { data } = await apiClient.post<LegalSearchResponse>("/api/search/legal", payload)
    return data
  },
}
