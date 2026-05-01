"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  MessageSquare,
  FileText,
  FilePlus,
  Search,
  ArrowRight,
  TrendingUp,
  Clock,
  FileCheck,
  Loader2,
  Calendar,
  AlertCircle,
  Download,
  Trash2,
  Eye,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-provider"
import { getApiErrorMessage } from "@/lib/api/client"
import { documentsApi, templatesApi } from "@/lib/api/services"
import type { StoredDocument } from "@/lib/api/types"
import { DocumentContent } from "@/components/documents/document-content"
import { downloadElementAsPdf, downloadTextFile, toPdfFilename, toTextFilename } from "@/lib/pdf"

const tools = [
  {
    title: "AI Chatbot",
    description: "Get instant answers to legal questions",
    icon: MessageSquare,
    href: "/dashboard/chatbot",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    title: "Summarizer",
    description: "Extract key points from documents",
    icon: FileText,
    href: "/dashboard/summarizer",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    title: "Document Generator",
    description: "Create legal documents from templates",
    icon: FilePlus,
    href: "/dashboard/generator",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    title: "Legal Search",
    description: "Search case law and statutes",
    icon: Search,
    href: "/dashboard/search",
    color: "bg-purple-500/10 text-purple-600",
  },
]

const recentActivity = [
  {
    id: 1,
    action: "Generated document",
    document: "Employment Contract",
    time: "2 hours ago",
    icon: FilePlus,
  },
  {
    id: 2,
    action: "Summarized",
    document: "Client Agreement.pdf",
    time: "4 hours ago",
    icon: FileText,
  },
  {
    id: 3,
    action: "AI Chat session",
    document: "Contract law questions",
    time: "Yesterday",
    icon: MessageSquare,
  },
  {
    id: 4,
    action: "Legal search",
    document: "Employment termination precedents",
    time: "Yesterday",
    icon: Search,
  },
]

const stats = [
  { label: "Documents Generated", value: "47", icon: FilePlus, trend: "+12%" },
  { label: "AI Queries", value: "234", icon: MessageSquare, trend: "+8%" },
  { label: "Hours Saved", value: "89", icon: Clock, trend: "+15%" },
  { label: "Documents Analyzed", value: "156", icon: FileCheck, trend: "+23%" },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<StoredDocument[]>([])
  const [templateNamesById, setTemplateNamesById] = useState<Record<string, string>>({})
  const [selectedDocument, setSelectedDocument] = useState<StoredDocument | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [isLoadingDocumentDetail, setIsLoadingDocumentDetail] = useState(false)
  const [isDownloadingDocumentPdf, setIsDownloadingDocumentPdf] = useState(false)
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null)
  const [documentToDelete, setDocumentToDelete] = useState<StoredDocument | null>(null)
  const [isDeletingDocument, setIsDeletingDocument] = useState(false)
  const [pdfDocument, setPdfDocument] = useState<StoredDocument | null>(null)
  const [documentsError, setDocumentsError] = useState<string | null>(null)
  const selectedDocumentContentRef = useRef<HTMLDivElement>(null)
  const pdfDocumentContentRef = useRef<HTMLDivElement>(null)
  const firstName = (user?.name || user?.email || "there").split(" ")[0]

  useEffect(() => {
    let ignore = false

    async function loadDocuments() {
      try {
        setIsLoadingDocuments(true)
        setDocumentsError(null)
        const [documentsData, templatesData] = await Promise.all([
          documentsApi.list(),
          templatesApi.list(),
        ])
        if (!ignore) {
          setDocuments(documentsData)
          setTemplateNamesById(
            Object.fromEntries(templatesData.map((template) => [template._id, template.name]))
          )
        }
      } catch (err) {
        if (!ignore) setDocumentsError(getApiErrorMessage(err))
      } finally {
        if (!ignore) setIsLoadingDocuments(false)
      }
    }

    loadDocuments()
    return () => {
      ignore = true
    }
  }, [])

  const getDocumentTitle = (document: StoredDocument) => {
    const templateName = document.metadata?.template_name
    if (typeof templateName === "string" && templateName.trim()) return templateName
    if (document.template_id && templateNamesById[document.template_id]) {
      return templateNamesById[document.template_id]
    }
    if (document.filename) return document.filename
    if (document.generated_text) return "Generated Document"
    if (document.summarized_text) return "Summarized Document"
    return "Generated Document"
  }

  const getDocumentBody = (document: StoredDocument) => {
    return document.summarized_text || document.generated_text || document.original_text || ""
  }

  const getDocumentType = (document: StoredDocument) => {
    if (document.source_type) return document.source_type.toUpperCase()
    if (document.generated_text) return "GENERATED"
    if (document.summarized_text) return "SUMMARY"
    return "DOCUMENT"
  }

  const formatDocumentDate = (value?: string | null) => {
    if (!value) return "Date unavailable"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Date unavailable"
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return documents

    return documents.filter((document) => {
      const searchableText = [
        getDocumentTitle(document),
        document.summarized_text,
        document.generated_text,
        document.original_text,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [documents, searchQuery])

  const handleDocumentOpen = async (document: StoredDocument) => {
    setSelectedDocument(document)
    setIsLoadingDocumentDetail(true)
    try {
      const detail = await documentsApi.get(document._id)
      setSelectedDocument(detail)
    } catch (err) {
      setDocumentsError(getApiErrorMessage(err))
    } finally {
      setIsLoadingDocumentDetail(false)
    }
  }

  useEffect(() => {
    if (!pdfDocument || !pdfDocumentContentRef.current) return

    async function downloadRenderedDocument() {
      if (!pdfDocumentContentRef.current || !pdfDocument) return
      const filename = toPdfFilename(getDocumentTitle(pdfDocument))
      const fallbackFilename = toTextFilename(getDocumentTitle(pdfDocument))
      setIsDownloadingDocumentPdf(true)
      try {
        await downloadElementAsPdf(pdfDocumentContentRef.current, filename)
      } catch (err) {
        setDocumentsError(getApiErrorMessage(err))
        downloadTextFile(getDocumentBody(pdfDocument), fallbackFilename)
      } finally {
        setIsDownloadingDocumentPdf(false)
        setDownloadingDocumentId(null)
        setPdfDocument(null)
      }
    }

    downloadRenderedDocument()
  }, [pdfDocument])

  const handleDownloadDocument = async (document: StoredDocument) => {
    if (isDownloadingDocumentPdf) return

    try {
      setDownloadingDocumentId(document._id)
      setDocumentsError(null)
      const detail = selectedDocument?._id === document._id ? selectedDocument : await documentsApi.get(document._id)
      setPdfDocument(detail)
    } catch (err) {
      setDownloadingDocumentId(null)
      setDocumentsError(getApiErrorMessage(err))
    }
  }

  const handleDownloadSelectedDocument = async () => {
    if (!selectedDocumentContentRef.current || !selectedDocument || isDownloadingDocumentPdf) return

    try {
      setIsDownloadingDocumentPdf(true)
      await downloadElementAsPdf(
        selectedDocumentContentRef.current,
        toPdfFilename(getDocumentTitle(selectedDocument))
      )
    } catch (err) {
      setDocumentsError(getApiErrorMessage(err))
      downloadTextFile(getDocumentBody(selectedDocument), toTextFilename(getDocumentTitle(selectedDocument)))
    } finally {
      setIsDownloadingDocumentPdf(false)
    }
  }

  const handleDownloadDocumentText = async (document: StoredDocument) => {
    try {
      setDocumentsError(null)
      const detail = selectedDocument?._id === document._id ? selectedDocument : await documentsApi.get(document._id)
      downloadTextFile(getDocumentBody(detail), toTextFilename(getDocumentTitle(detail)))
    } catch (err) {
      setDocumentsError(getApiErrorMessage(err))
    }
  }

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return

    try {
      setIsDeletingDocument(true)
      setDocumentsError(null)
      await documentsApi.delete(documentToDelete._id)
      setDocuments((prev) => prev.filter((document) => document._id !== documentToDelete._id))
      if (selectedDocument?._id === documentToDelete._id) setSelectedDocument(null)
      setDocumentToDelete(null)
    } catch (err) {
      setDocumentsError(getApiErrorMessage(err))
    } finally {
      setIsDeletingDocument(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {"Here's what's happening with your legal work today."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-sm text-emerald-600">
                <TrendingUp className="h-4 w-4" />
                {stat.trend}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tools Grid */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">AI Tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <Link key={tool.title} href={tool.href}>
              <Card className="group h-full cursor-pointer border-border/50 transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5">
                <CardHeader>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${tool.color} transition-colors`}
                  >
                    <tool.icon className="h-6 w-6" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {tool.title}
                    <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {tool.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Your Documents</h2>
            <p className="text-sm text-muted-foreground">
              Browse saved summaries and generated legal documents.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search documents..."
              className="pl-9"
            />
          </div>
        </div>

        {documentsError && (
          <Card className="mb-4 border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-3 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {documentsError}
            </CardContent>
          </Card>
        )}

        {isLoadingDocuments ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="border-border/50">
                <CardHeader>
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map((document) => {
              const preview = getDocumentBody(document)
              return (
                <Card
                  key={document._id}
                  className="group flex h-full flex-col border-border/50 transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="line-clamp-2 text-lg">
                        {getDocumentTitle(document)}
                      </CardTitle>
                      <Badge variant="secondary">{getDocumentType(document)}</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDocumentDate(document.created_at)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {preview || "No preview is available for this document."}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleDocumentOpen(document)}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        disabled={isDownloadingDocumentPdf}
                        onClick={() => handleDownloadDocument(document)}
                      >
                        {downloadingDocumentId === document._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleDownloadDocumentText(document)}
                      >
                        <Download className="h-4 w-4" />
                        .txt
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() => setDocumentToDelete(document)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">
                {documents.length ? "No matching documents" : "No documents yet"}
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {documents.length
                  ? "Try searching by filename, summary, or document content."
                  : "Upload a PDF in Summarizer or generate a document to see it here."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View all
          </Button>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <activity.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.document}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          {selectedDocument && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 pr-8">
                  <DialogTitle className="line-clamp-2">
                    {getDocumentTitle(selectedDocument)}
                  </DialogTitle>
                  <Badge variant="secondary">{getDocumentType(selectedDocument)}</Badge>
                </div>
                <DialogDescription>
                  Created {formatDocumentDate(selectedDocument.created_at)}
                </DialogDescription>
              </DialogHeader>

              {isLoadingDocumentDetail ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div className="space-y-5">
                  <section>
                    <h3 className="mb-2 text-sm font-medium">
                      {selectedDocument.generated_text ? "Generated Document" : "Summary"}
                    </h3>
                    <div className="rounded-lg border bg-card p-4">
                      <div ref={selectedDocumentContentRef} className="bg-white p-6 text-black">
                        <DocumentContent
                          content={
                            getDocumentBody(selectedDocument) ||
                            "No summary content is available."
                          }
                        />
                      </div>
                    </div>
                  </section>

                  {selectedDocument.original_text && (
                    <section>
                      <h3 className="mb-2 text-sm font-medium">Original Text Preview</h3>
                      <div className="max-h-48 overflow-y-auto rounded-lg border bg-muted/40 p-4">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {selectedDocument.original_text}
                        </p>
                      </div>
                    </section>
                  )}

                  <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">Document ID</p>
                      <p className="mt-1 break-all font-medium">{selectedDocument._id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="mt-1 font-medium">{getDocumentType(selectedDocument)}</p>
                    </div>
                    {selectedDocument.template_version && (
                      <div>
                        <p className="text-muted-foreground">Template Version</p>
                        <p className="mt-1 font-medium">{selectedDocument.template_version}</p>
                      </div>
                    )}
                    {typeof selectedDocument.retrieved_context_count === "number" && (
                      <div>
                        <p className="text-muted-foreground">Context Matches</p>
                        <p className="mt-1 font-medium">
                          {selectedDocument.retrieved_context_count}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadSelectedDocument}
                  disabled={isLoadingDocumentDetail || isDownloadingDocumentPdf}
                >
                  {isDownloadingDocumentPdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadDocumentText(selectedDocument)}
                  disabled={isLoadingDocumentDetail}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download .txt
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDocumentToDelete(selectedDocument)}
                  disabled={isLoadingDocumentDetail || isDeletingDocument}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button asChild disabled={isLoadingDocumentDetail}>
                  <Link href={`/dashboard/chatbot?document_id=${selectedDocument._id}`}>
                    {isLoadingDocumentDetail && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Chat with this document
                  </Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{documentToDelete ? getDocumentTitle(documentToDelete) : "this document"}" from your documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingDocument}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeletingDocument}
              onClick={handleDeleteDocument}
            >
              {isDeletingDocument && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed -left-[9999px] top-0 w-[794px] bg-white p-6 text-black">
        {pdfDocument && (
          <div ref={pdfDocumentContentRef} className="bg-white p-6 text-black">
            <DocumentContent
              content={getDocumentBody(pdfDocument) || "No document content is available."}
            />
          </div>
        )}
      </div>
    </div>
  )
}
