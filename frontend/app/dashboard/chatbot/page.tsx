"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Scale, User, Loader2, Sparkles, Upload, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { chatbotApi, documentsApi, summarizerApi } from "@/lib/api/services"
import { getApiErrorMessage } from "@/lib/api/client"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { StoredDocument } from "@/lib/api/types"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const suggestedPrompts = [
  "What are the key elements of a valid contract?",
  "Explain the difference between civil and criminal law",
  "What constitutes breach of fiduciary duty?",
  "How does intellectual property protection work?",
]

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [documents, setDocuments] = useState<StoredDocument[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const [activeDocumentName, setActiveDocumentName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    let ignore = false

    async function loadDocuments() {
      try {
        setIsLoadingDocuments(true)
        const data = await documentsApi.list()
        if (!ignore) {
          setDocuments(data)
          const documentId = new URLSearchParams(window.location.search).get("document_id")
          if (documentId) {
            const selectedDocument = data.find((document) => document._id === documentId)
            setActiveDocumentId(documentId)
            setActiveDocumentName(
              selectedDocument ? getDocumentLabel(selectedDocument) : `Document ${documentId.slice(0, 8)}`
            )
          }
        }
      } catch (err) {
        if (!ignore) setError(getApiErrorMessage(err))
      } finally {
        if (!ignore) setIsLoadingDocuments(false)
      }
    }

    loadDocuments()
    return () => {
      ignore = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    const query = input.trim()
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await chatbotApi.query(
        activeDocumentId ? { query, document_id: activeDocumentId } : { query }
      )
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const message = getApiErrorMessage(err)
      setError(message)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: message,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  const getDocumentLabel = (document: StoredDocument) => {
    if (document.filename) return document.filename
    if (document.generated_text) return "Generated document"
    if (document.summarized_text) return "Summarized document"
    return `Document ${document._id.slice(0, 8)}`
  }

  const handleDocumentSelect = (documentId: string) => {
    const selectedDocument = documents.find((document) => document._id === documentId)
    setActiveDocumentId(documentId)
    setActiveDocumentName(selectedDocument ? getDocumentLabel(selectedDocument) : documentId)
    setError(null)
  }

  const refreshDocuments = async () => {
    try {
      setDocuments(await documentsApi.list())
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || isUploading) return

    const filename = file.name.toLowerCase()
    const isPdf = filename.endsWith(".pdf")
    const isImage = /\.(png|jpe?g|bmp|tiff|webp)$/i.test(filename)

    if (!isPdf && !isImage) {
      setError("Upload a PDF or supported image file: PNG, JPG, JPEG, BMP, TIFF, or WEBP.")
      return
    }

    try {
      setIsUploading(true)
      setError(null)
      const response = isPdf
        ? await summarizerApi.uploadPdf(file)
        : await summarizerApi.uploadOcr(file)

      if (!response.document_id) {
        console.error("Summarizer response did not include document_id", response)
        setError("Document uploaded, but no document ID was returned. Continuing in normal chat mode.")
        setActiveDocumentId(null)
        setActiveDocumentName(null)
        return
      }

      setActiveDocumentId(response.document_id)
      setActiveDocumentName(response.filename || file.name)
      await refreshDocuments()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsUploading(false)
    }
  }

  const clearActiveDocument = () => {
    setActiveDocumentId(null)
    setActiveDocumentName(null)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          AI Legal Chatbot
        </h1>
        <p className="mt-1 text-muted-foreground">
          Ask questions about legal concepts, procedures, and research
        </p>
      </div>

      {/* Chat Container */}
      <Card className="flex flex-1 flex-col overflow-hidden border-border/50">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Scale className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mt-6 text-xl font-semibold">
                How can I help you today?
              </h2>
              <p className="mt-2 text-center text-muted-foreground">
                Ask me anything about legal concepts, procedures, or research
              </p>

              {/* Suggested Prompts */}
              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="rounded-lg border border-border bg-card p-4 text-left text-sm transition-colors hover:border-accent hover:bg-muted/50"
                  >
                    <Sparkles className="mb-2 h-4 w-4 text-accent" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
                      <Scale className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-2xl rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-xs",
                        message.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
                    <Scale className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-4">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <Select
                value={activeDocumentId || ""}
                onValueChange={handleDocumentSelect}
                disabled={isLoadingDocuments || isUploading || documents.length === 0}
              >
                <SelectTrigger className="h-9 w-full sm:w-64">
                  <SelectValue
                    placeholder={
                      isLoadingDocuments
                        ? "Loading documents..."
                        : documents.length
                          ? "Chat with a document"
                          : "No documents yet"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((document) => (
                    <SelectItem key={document._id} value={document._id}>
                      {getDocumentLabel(document)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeDocumentId && (
                <Badge variant="secondary" className="max-w-full gap-2">
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate">{activeDocumentName || activeDocumentId}</span>
                  <button
                    type="button"
                    onClick={clearActiveDocument}
                    className="ml-1 rounded-sm hover:text-destructive"
                    aria-label="Clear active document"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.bmp,.tiff,.webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeDocumentId ? "Ask about the selected document..." : "Ask a legal question..."}
              className="min-h-[52px] max-h-32 flex-1 resize-none bg-muted/50"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              className="h-[52px] w-[52px] shrink-0"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
          {error && (
            <p className="mt-2 text-center text-xs text-destructive">{error}</p>
          )}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Legal Edge AI provides general information only. Always consult a
            qualified attorney for legal advice.
          </p>
        </div>
      </Card>
    </div>
  )
}
