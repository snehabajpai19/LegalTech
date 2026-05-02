"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  FileStack,
  Lock,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Eye,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getApiErrorMessage } from "@/lib/api/client"
import { templatesApi } from "@/lib/api/services"
import type { DocumentTemplate } from "@/lib/api/types"

const allCategoriesLabel = "All Categories"
const otherCategoryValue = "Others"
const legalCategoryOptions = [
  "FIR",
  "Legal Notice",
  "Contract",
  "Affidavit",
  "Agreement",
  "Complaint",
  "NDA (Non-Disclosure Agreement)",
  otherCategoryValue,
]

const systemTemplateNames = new Set([
  "fir",
  "fir - theft",
  "affidavit",
  "contract",
  "agreement",
  "complaint",
  "legal notice",
  "notice to employer",
  "nda",
  "nda (non-disclosure agreement)",
])

const systemTemplateCategories = new Set([
  "fir",
  "affidavit",
  "contract",
  "agreement",
  "complaint",
  "legal notice",
  "notice",
  "nda",
  "nda (non-disclosure agreement)",
])

const emptyTemplateForm = {
  name: "",
  category: "",
  description: "",
  template_text: "",
  fieldsJson: "[]",
  version: "1.0.0",
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm)
  const [customCategory, setCustomCategory] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = useMemo(() => {
    const values = new Set([allCategoriesLabel, ...legalCategoryOptions])
    templates.forEach((template) => {
      if (template.category) values.add(template.category)
    })
    return Array.from(values)
  }, [templates])

  const displayCategory = (category?: string | null) => {
    return category?.trim() || "Uncategorized"
  }

  const normalizeTemplateValue = (value?: string | null) => {
    return (value || "").trim().toLowerCase()
  }

  const getDuplicateTemplateName = (name: string) => {
    const existingNames = new Set(templates.map((template) => normalizeTemplateValue(template.name)))
    const baseName = `${name} Copy`
    if (!existingNames.has(normalizeTemplateValue(baseName))) return baseName

    let copyNumber = 2
    let nextName = `${baseName} ${copyNumber}`
    while (existingNames.has(normalizeTemplateValue(nextName))) {
      copyNumber += 1
      nextName = `${baseName} ${copyNumber}`
    }
    return nextName
  }

  const isSystemTemplate = (template: DocumentTemplate) => {
    const maybeSystemFlag = (template as DocumentTemplate & { is_system?: boolean }).is_system
    if (maybeSystemFlag) return true

    const name = normalizeTemplateValue(template.name)
    const category = normalizeTemplateValue(template.category)
    if (systemTemplateNames.has(name)) return true

    return (
      systemTemplateCategories.has(category) &&
      Array.from(systemTemplateCategories).some(
        (systemName) => name === systemName || name.startsWith(`${systemName} -`)
      )
    )
  }

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setTemplates(await templatesApi.list())
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const filteredTemplates = templates.filter((template) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.category.toLowerCase().includes(query)
    const matchesCategory =
      selectedCategory === allCategoriesLabel ||
      template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const systemTemplates = filteredTemplates.filter(isSystemTemplate)
  const userTemplates = filteredTemplates.filter((template) => !isSystemTemplate(template))

  const openCreateDialog = () => {
    setEditingTemplate(null)
    setTemplateForm(emptyTemplateForm)
    setCustomCategory("")
    setError(null)
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (template: DocumentTemplate) => {
    const knownCategory = categories.includes(template.category)
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      category: knownCategory ? template.category : otherCategoryValue,
      description: template.description,
      template_text: template.template_text,
      fieldsJson: JSON.stringify(template.fields, null, 2),
      version: template.version,
    })
    setCustomCategory(knownCategory ? "" : template.category)
    setError(null)
    setIsCreateDialogOpen(true)
  }

  const handleSaveTemplate = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const fields = JSON.parse(templateForm.fieldsJson)
      const category =
        templateForm.category === otherCategoryValue
          ? customCategory.trim()
          : templateForm.category
      const payload = {
        name: templateForm.name,
        category,
        description: templateForm.description,
        template_text: templateForm.template_text,
        fields,
        version: templateForm.version || "1.0.0",
      }
      if (editingTemplate) {
        const updated = await templatesApi.update(editingTemplate._id, payload)
        setTemplates((prev) => prev.map((template) => (template._id === updated._id ? updated : template)))
      } else {
        const created = await templatesApi.create(payload)
        setTemplates((prev) => [created, ...prev])
      }
      setTemplateForm(emptyTemplateForm)
      setCustomCategory("")
      setEditingTemplate(null)
      setIsCreateDialogOpen(false)
    } catch (err) {
      setError(err instanceof SyntaxError ? "Fields must be valid JSON." : getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDuplicateTemplate = async (template: DocumentTemplate) => {
    try {
      setError(null)
      const created = await templatesApi.create({
        name: getDuplicateTemplateName(template.name),
        category: template.category,
        description: template.description,
        template_text: template.template_text,
        fields: template.fields,
        version: template.version || "1.0.0",
      })
      setTemplates((prev) => [created, ...prev])
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      setError(null)
      await templatesApi.delete(id)
      setTemplates((prev) => prev.filter((template) => template._id !== id))
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const effectiveCategory =
    templateForm.category === otherCategoryValue
      ? customCategory.trim()
      : templateForm.category

  const renderTemplateRows = (items: DocumentTemplate[], emptyMessage: string) => (
    <TableBody>
      {items.map((template) => {
        const systemTemplate = isSystemTemplate(template)
        return (
          <TableRow
            key={template._id}
            className="cursor-pointer"
            onClick={() => router.push(`/dashboard/generator?template_id=${template._id}`)}
          >
            <TableCell>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{template.name}</p>
                  {systemTemplate && (
                    <Badge variant="outline" className="gap-1">
                      <Lock className="h-3 w-3" />
                      System
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge variant="secondary">{displayCategory(template.category)}</Badge>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              {new Date(template.updated_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Badge variant="default">active</Badge>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              {template.fields.length} fields
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(template.template_text)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={systemTemplate}
                    onClick={() => openEditDialog(template)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDuplicateTemplate(template)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    disabled={systemTemplate}
                    onClick={() => handleDeleteTemplate(template._id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        )
      })}
      {!isLoading && items.length === 0 && (
        <TableRow>
          <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
            {emptyMessage}
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )

  const renderTemplateSection = (
    title: string,
    description: string,
    items: DocumentTemplate[],
    emptyMessage: string
  ) => (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileStack className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {isLoading ? "Loading templates..." : `${items.length} ${description}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden lg:table-cell">Last Modified</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Usage</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          {renderTemplateRows(items, emptyMessage)}
        </Table>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            Document Templates
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage and customize your legal document templates
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-2xl">
            <DialogHeader className="shrink-0 border-b px-6 pb-4 pt-6 pr-12">
              <DialogTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
              <DialogDescription>
                {editingTemplate ? "Update this document template" : "Add a new document template to your library"}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  placeholder="Enter template name"
                  value={templateForm.name}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={templateForm.category}
                  onValueChange={(value) =>
                    setTemplateForm((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter((cat) => cat !== "All Categories").map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {displayCategory(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {templateForm.category === otherCategoryValue && (
                <div className="space-y-2">
                  <Label htmlFor="customCategory">Enter custom category</Label>
                  <Input
                    id="customCategory"
                    placeholder="Enter custom category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter template description"
                  className="min-h-24 resize-y"
                  value={templateForm.description}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateText">Template Text</Label>
                <Textarea
                  id="templateText"
                  placeholder="Use Jinja fields like {{ client_name }}"
                  rows={6}
                  className="min-h-40 resize-y font-mono text-sm"
                  value={templateForm.template_text}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({ ...prev, template_text: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <div className="space-y-2">
                  <Label htmlFor="fieldsJson">Fields JSON</Label>
                  <Textarea
                    id="fieldsJson"
                    rows={5}
                    className="min-h-36 resize-y font-mono text-sm"
                    value={templateForm.fieldsJson}
                    onChange={(e) =>
                      setTemplateForm((prev) => ({ ...prev, fieldsJson: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={templateForm.version}
                    onChange={(e) =>
                      setTemplateForm((prev) => ({ ...prev, version: e.target.value }))
                    }
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter className="shrink-0 border-t px-6 pb-6 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={!templateForm.name || !effectiveCategory || !templateForm.template_text || isSaving}
              >
                {isSaving ? "Saving..." : editingTemplate ? "Save Changes" : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {displayCategory(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && !isCreateDialogOpen && <p className="text-sm text-destructive">{error}</p>}

      {renderTemplateSection(
        "System Templates",
        "system templates",
        systemTemplates,
        "No system templates found"
      )}

      {renderTemplateSection(
        "My Templates",
        "custom templates",
        userTemplates,
        "No custom templates found"
      )}
    </div>
  )
}
