"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  FilePlus,
  FileText,
  Loader2,
  Copy,
  Download,
  CheckCircle,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { generatorApi, templatesApi } from "@/lib/api/services"
import { getApiErrorMessage } from "@/lib/api/client"
import type { DocumentTemplate, TemplateField } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { DocumentContent } from "@/components/documents/document-content"
import { downloadElementAsPdf, downloadTextFile, toPdfFilename, toTextFilename } from "@/lib/pdf"

export default function GeneratorPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null)
  const [generatedDocumentId, setGeneratedDocumentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const documentPreviewRef = useRef<HTMLDivElement>(null)

  const activeTemplate = useMemo(
    () => templates.find((template) => template._id === selectedTemplate),
    [selectedTemplate, templates]
  )

  useEffect(() => {
    let ignore = false
    async function loadTemplates() {
      try {
        setIsLoadingTemplates(true)
        setError(null)
        const data = await templatesApi.list()
        if (!ignore) {
          setTemplates(data)
          const templateId = new URLSearchParams(window.location.search).get("template_id")
          if (templateId) {
            const template = data.find((item) => item._id === templateId)
            if (template) {
              setSelectedTemplate(templateId)
              setFormData(Object.fromEntries(template.fields.map((field) => [field.name, ""])))
            }
          }
        }
      } catch (err) {
        if (!ignore) setError(getApiErrorMessage(err))
      } finally {
        if (!ignore) setIsLoadingTemplates(false)
      }
    }
    loadTemplates()
    return () => {
      ignore = true
    }
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    setGeneratedDocument(null)
    setGeneratedDocumentId(null)
    setError(null)
    const template = templates.find((item) => item._id === templateId)
    const nextFormData = Object.fromEntries((template?.fields || []).map((field) => [field.name, ""]))
    setFormData(nextFormData)
  }

  const handleGenerate = async () => {
    if (!selectedTemplate) return
    setIsGenerating(true)
    setError(null)

    try {
      const response = await generatorApi.render({
        template_id: selectedTemplate,
        inputs: formData,
        output_format: "text",
      })
      setGeneratedDocument(response.generated_text)
      setGeneratedDocumentId(response.document_id)
      toast({
        title: "Document generated",
        description: "Your legal document is ready to review.",
      })
    } catch (err) {
      const message = getApiErrorMessage(err)
      setError(message)
      toast({
        title: "Generation failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (generatedDocument) {
      await navigator.clipboard.writeText(generatedDocument)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copied to clipboard",
        description: "The generated document text was copied.",
      })
    }
  }

  const handleDownloadPdf = async () => {
    if (!documentPreviewRef.current || isDownloadingPdf) return

    const fallbackFilename = toTextFilename(activeTemplate?.name || generatedDocumentId || "document")
    try {
      setIsDownloadingPdf(true)
      const filename = toPdfFilename(activeTemplate?.name || generatedDocumentId || "generated_document")
      await downloadElementAsPdf(
        documentPreviewRef.current,
        filename
      )
      toast({
        title: "PDF downloaded",
        description: `${filename} is ready.`,
      })
    } catch {
      toast({
        title: "Download failed",
        description: `${fallbackFilename} was downloaded instead.`,
      })
      if (generatedDocument) downloadTextFile(generatedDocument, fallbackFilename)
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const handleDownloadText = () => {
    if (!generatedDocument) return
    const filename = toTextFilename(activeTemplate?.name || generatedDocumentId || "document")
    downloadTextFile(generatedDocument, filename)
    toast({
      title: "Text downloaded",
      description: `${filename} is ready.`,
    })
  }

  const isFormValid =
    Boolean(selectedTemplate) &&
    (activeTemplate?.fields || []).every((field) => !field.required || Boolean(formData[field.name]?.trim()))

  const renderField = (field: TemplateField) => {
    if (field.type === "textarea") {
      return (
        <Textarea
          id={field.name}
          name={field.name}
          placeholder={field.placeholder || field.description || ""}
          rows={4}
          value={formData[field.name] || ""}
          onChange={handleInputChange}
        />
      )
    }

    if (field.type === "select" && field.options?.length) {
      return (
        <Select
          value={formData[field.name] || ""}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, [field.name]: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    return (
      <Input
        id={field.name}
        name={field.name}
        type={field.type === "number" || field.type === "date" ? field.type : "text"}
        placeholder={field.placeholder || field.description || ""}
        value={formData[field.name] || ""}
        onChange={handleInputChange}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Toaster />
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Document Generator
        </h1>
        <p className="mt-1 text-muted-foreground">
          Generate professional legal documents from customizable templates
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Section */}
        <div className="space-y-6">
          {/* Template Selection */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FilePlus className="h-5 w-5" />
                Select Template
              </CardTitle>
              <CardDescription>
                Choose a template to customize
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange} disabled={isLoadingTemplates}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingTemplates ? "Loading templates..." : "Select a template..."} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      <div className="flex flex-col items-start">
                        <span>{template.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {template.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>

          {/* Dynamic Form */}
          {selectedTemplate && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Document Details
                </CardTitle>
                <CardDescription>
                  Fill in the required information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeTemplate?.fields.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {activeTemplate.fields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                          {field.label}
                          {field.required ? "" : " (Optional)"}
                        </Label>
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This template does not require any inputs.
                  </p>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={!isFormValid || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Document
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Section */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Document Preview
              </CardTitle>
              {generatedDocument && (
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
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                  >
                    {isDownloadingPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Download as PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleDownloadText}
                  >
                    <Download className="h-4 w-4" />
                    Download .txt
                  </Button>
                </div>
              )}
            </div>
            <CardDescription>
              Preview your generated document
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex h-96 flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 font-medium">Generating document...</p>
                <p className="text-sm text-muted-foreground">
                  AI is drafting your legal document
                </p>
              </div>
            ) : generatedDocument ? (
              <div className="max-h-[600px] overflow-y-auto rounded-lg border border-border bg-card p-4">
                <div ref={documentPreviewRef} className="bg-white p-6 text-black">
                  <DocumentContent content={generatedDocument} />
                </div>
              </div>
            ) : (
              <div className="flex h-96 flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium text-muted-foreground">
                  No document generated yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Select a template and fill in the details to generate
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
