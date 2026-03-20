"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { FileText, Tag, Folder } from "lucide-react"
import type { Document, Category, Series } from "@/lib/types"

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [documents, setDocuments] = React.useState<Document[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [series, setSeries] = React.useState<Series[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const supabase = createClient()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  React.useEffect(() => {
    if (!query || query.length < 2) {
      setDocuments([])
      setCategories([])
      setSeries([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true)

      const [docsResult, catsResult, seriesResult] = await Promise.all([
        supabase
          .from("documents")
          .select("id, title, description, category_id")
          .eq("status", "published")
          .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
          .limit(5),
        supabase
          .from("categories")
          .select("*")
          .ilike("name", `%${query}%`)
          .limit(3),
        supabase
          .from("series")
          .select("*")
          .ilike("title", `%${query}%`)
          .limit(3),
      ])

      setDocuments(docsResult.data || [])
      setCategories(catsResult.data || [])
      setSeries(seriesResult.data || [])
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query, supabase])

  const handleSelect = (type: string, id: string) => {
    onOpenChange(false)
    setQuery("")
    
    switch (type) {
      case "document":
        router.push(`/document/${id}`)
        break
      case "category":
        router.push(`/category/${id}`)
        break
      case "series":
        router.push(`/series/${id}`)
        break
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar documentos, categorías, series..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? "Buscando..." : "No se encontraron resultados."}
        </CommandEmpty>
        
        {documents.length > 0 && (
          <CommandGroup heading="Documentos">
            {documents.map((doc) => (
              <CommandItem
                key={doc.id}
                onSelect={() => handleSelect("document", doc.id)}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{doc.title}</span>
                  {doc.description && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {doc.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {categories.length > 0 && (
          <CommandGroup heading="Categorías">
            {categories.map((cat) => (
              <CommandItem
                key={cat.id}
                onSelect={() => handleSelect("category", cat.slug)}
                className="cursor-pointer"
              >
                <Tag className="mr-2 h-4 w-4" style={{ color: cat.color }} />
                <span>{cat.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {series.length > 0 && (
          <CommandGroup heading="Series">
            {series.map((s) => (
              <CommandItem
                key={s.id}
                onSelect={() => handleSelect("series", s.id)}
                className="cursor-pointer"
              >
                <Folder className="mr-2 h-4 w-4" />
                <span>{s.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
