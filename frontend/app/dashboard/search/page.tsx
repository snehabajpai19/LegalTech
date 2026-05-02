"use client"

import { useState } from "react"
import {
  Search,
  FileText,
  Clock,
  ExternalLink,
  Filter,
  BookOpen,
  Scale,
  Gavel,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api/client"
import { searchApi } from "@/lib/api/services"
import type { LegalSearchHit } from "@/lib/api/types"

interface SearchResult {
  id: string
  title: string
  type: "case" | "statute" | "regulation"
  court?: string
  year: string
  citation: string
  excerpt: string
  content: string
  metadata: Record<string, unknown>
  distance: number
  relevance: number
}

const recentSearches = [
  "employment termination",
  "breach of contract remedies",
  "intellectual property infringement",
  "non-compete clause enforceability",
]

export default function LegalSearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedType, setSelectedType] = useState("all")
  const [hasSearched, setHasSearched] = useState(false)
  const [indexReady, setIndexReady] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

  const toSearchResult = (hit: LegalSearchHit, index: number): SearchResult => {
    const metadata = hit.metadata || {}
    const rawType = String(metadata.type || metadata.doc_type || "statute").toLowerCase()
    const type =
      rawType === "case" || rawType === "regulation" || rawType === "statute"
        ? rawType
        : "statute"

    const act = metadata.act ? String(metadata.act) : ""
    const section = metadata.section ? String(metadata.section) : ""
    const title =
      String(metadata.title || metadata.section_title || "").trim() ||
      [act, section ? `Section ${section}` : ""].filter(Boolean).join(" - ") ||
      `Legal result ${index + 1}`

    return {
      id: `${index}-${hit.distance}`,
      title,
      type,
      court: metadata.court ? String(metadata.court) : undefined,
      year: String(metadata.year || metadata.date || "N/A"),
      citation: String(metadata.citation || metadata.source || metadata.act || "Legal index"),
      excerpt: hit.content,
      content: hit.content,
      metadata,
      distance: hit.distance,
      relevance: Math.max(0, Math.round((1 - Math.min(hit.distance, 1)) * 100)),
    }
  }

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setHasSearched(true)
    setError(null)
    if (query) setSearchQuery(query)

    try {
      const response = await searchApi.legal({ query: searchTerm, top_k: 10 })
      setIndexReady(response.index_ready)
      setResults(response.results.map(toSearchResult))
    } catch (err) {
      setError(getApiErrorMessage(err))
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "case":
        return Gavel
      case "statute":
        return BookOpen
      case "regulation":
        return Scale
      default:
        return FileText
    }
  }

  const filteredResults =
    selectedType === "all"
      ? results
      : results.filter((result) => result.type === selectedType)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Legal Search
        </h1>
        <p className="mt-1 text-muted-foreground">
          Search case law, statutes, and regulations with AI-powered semantic search
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for cases, statutes, or legal concepts..."
                className="h-12 pl-12 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button
              size="lg"
              className="h-12 px-8"
              onClick={() => handleSearch()}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {!hasSearched && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-muted-foreground">
                Recent searches:
              </p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleSearch(search)}
                    className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {hasSearched && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {indexReady ? `${filteredResults.length} results found` : "Search index is not ready"}
            </p>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="case">Cases</SelectItem>
                  <SelectItem value="statute">Statutes</SelectItem>
                  <SelectItem value="regulation">Regulations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!indexReady && (
              <Card className="border-border/50">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  The legal search index is not ready yet. Run the backend embedding job and try again.
                </CardContent>
              </Card>
            )}
            {indexReady && filteredResults.length === 0 && !isSearching && !error && (
              <Card className="border-border/50">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No matching legal results found.
                </CardContent>
              </Card>
            )}
            {filteredResults.map((result) => {
              const TypeIcon = getTypeIcon(result.type)
              return (
                <Card
                  key={result.id}
                  className="group cursor-pointer border-border/50 transition-all hover:border-accent/50 hover:shadow-md"
                  onClick={() => setSelectedResult(result)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "gap-1",
                              result.type === "case" && "bg-blue-500/10 text-blue-600",
                              result.type === "statute" && "bg-emerald-500/10 text-emerald-600",
                              result.type === "regulation" && "bg-amber-500/10 text-amber-600"
                            )}
                          >
                            <TypeIcon className="h-3 w-3" />
                            {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                          </Badge>
                          {result.court && <Badge variant="outline">{result.court}</Badge>}
                          <Badge variant="outline">{result.year}</Badge>
                        </div>

                        <h3 className="text-lg font-semibold group-hover:text-primary">
                          {result.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {result.citation}
                        </p>
                        <p className="mt-3 line-clamp-4 text-sm leading-relaxed">{result.excerpt}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 text-sm">
                          <span className="font-semibold text-accent">
                            {result.relevance}%
                          </span>
                          <span className="text-muted-foreground">relevance</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedResult(result)
                          }}
                        >
                          View Full
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {!hasSearched && (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">Search Legal Resources</h3>
            <p className="mt-2 max-w-md text-center text-muted-foreground">
              Enter your search query to find relevant cases, statutes, and
              regulations. Our AI will find the most relevant results.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          {selectedResult && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 pr-8">
                  <DialogTitle className="line-clamp-2">{selectedResult.title}</DialogTitle>
                  <Badge variant="secondary">
                    {selectedResult.type.charAt(0).toUpperCase() + selectedResult.type.slice(1)}
                  </Badge>
                </div>
                <DialogDescription>
                  {selectedResult.citation}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <section>
                  <h3 className="mb-2 text-sm font-medium">Full Text</h3>
                  <div className="max-h-[45vh] overflow-y-auto rounded-lg border bg-muted/30 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {selectedResult.content}
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-medium">Metadata</h3>
                  <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
                    {Object.entries(selectedResult.metadata).length > 0 ? (
                      Object.entries(selectedResult.metadata).map(([key, value]) => (
                        <div key={key}>
                          <p className="capitalize text-muted-foreground">
                            {key.replaceAll("_", " ")}
                          </p>
                          <p className="mt-1 break-words font-medium">
                            {String(value)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No metadata available.</p>
                    )}
                    <div>
                      <p className="text-muted-foreground">Distance</p>
                      <p className="mt-1 font-medium">{selectedResult.distance.toFixed(4)}</p>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
