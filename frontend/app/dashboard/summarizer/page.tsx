"use client"

import { useState, useCallback } from "react"
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  Copy,
  Download,
  X,
  ScanText,
  File,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api/client"
import { summarizerApi } from "@/lib/api/services"

interface UploadedFile {
  name: string
  size: number
  type: string
  file: File
}

export default function SummarizerPage() {
  const [activeTab, setActiveTab] = useState<"pdf" | "ocr">("pdf")
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const setFile = (file: File) => {
    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    })
    setSummary(null)
    setDocumentId(null)
    setError(null)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleProcess = async () => {
    if (!uploadedFile) return

    const isPdf = uploadedFile.name.toLowerCase().endsWith(".pdf")
    const isImage = /\.(png|jpe?g|bmp|tiff|webp)$/i.test(uploadedFile.name)
    if (activeTab === "pdf" && !isPdf) {
      setError("Only PDF files are supported for PDF upload.")
      return
    }
    if (activeTab === "ocr" && !isImage) {
      setError("Only .png, .jpg, .jpeg, .bmp, .tiff, or .webp files are supported for OCR.")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response =
        activeTab === "pdf"
          ? await summarizerApi.uploadPdf(uploadedFile.file)
          : await summarizerApi.uploadOcr(uploadedFile.file)
      setSummary(response.summary)
      setDocumentId(response.document_id)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleReset = () => {
    setUploadedFile(null)
    setSummary(null)
    setDocumentId(null)
    setError(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Document Summarizer
        </h1>
        <p className="mt-1 text-muted-foreground">
          Upload legal documents to get AI-powered summaries and key insights
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </CardTitle>
            <CardDescription>
              Drag and drop your document or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => {
              setActiveTab(value as "pdf" | "ocr")
              handleReset()
            }} className="w-full">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="pdf" className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  PDF Upload
                </TabsTrigger>
                <TabsTrigger value="ocr" className="flex-1">
                  <ScanText className="mr-2 h-4 w-4" />
                  OCR Scan
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pdf">
                {!uploadedFile ? (
                  <div
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors",
                      dragActive
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/50"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileInput}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <p className="mt-4 text-center font-medium">
                      Drop your file here, or{" "}
                      <span className="text-accent">browse</span>
                    </p>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      Supports PDF files up to 25MB
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-muted/30 p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <File className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(uploadedFile.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleReset}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      className="mt-6 w-full"
                      onClick={handleProcess}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Summary
                        </>
                      )}
                    </Button>
                    {error && (
                      <p className="mt-3 text-sm text-destructive">{error}</p>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ocr">
                {!uploadedFile ? (
                  <div
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors",
                      dragActive
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/50"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.bmp,.tiff,.webp"
                      onChange={handleFileInput}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                      <ScanText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-center font-medium">
                      Drop your image here, or <span className="text-accent">browse</span>
                    </p>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      Supports PNG, JPG, JPEG, BMP, TIFF, and WEBP
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-muted/30 p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <File className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(uploadedFile.size)}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={handleReset} className="shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button className="mt-6 w-full" onClick={handleProcess} disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ScanText className="mr-2 h-4 w-4" />
                          Generate OCR Summary
                        </>
                      )}
                    </Button>
                    {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Summary Section */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Summary Output
              </CardTitle>
              {summary && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              )}
            </div>
            <CardDescription>
              AI-generated analysis and key findings
              {documentId ? ` | Document ID: ${documentId}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isProcessing ? (
              <div className="flex h-64 flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 font-medium">Analyzing document...</p>
                <p className="text-sm text-muted-foreground">
                  This may take a few moments
                </p>
              </div>
            ) : summary ? (
              <div className="max-h-[500px] overflow-y-auto rounded-lg bg-muted/30 p-6">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {summary}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium text-muted-foreground">
                  No summary yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Upload a document to generate a summary
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
