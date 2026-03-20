import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { DocumentCard } from "@/components/documents/document-card"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import type { Document, Category } from "@/lib/types"

interface Props {
  searchParams: Promise<{ q?: string; category?: string; tag?: string }>
}

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams
  return {
    title: q ? `Búsqueda: ${q} | Biblioteca de Análisis` : "Búsqueda | Biblioteca de Análisis",
  }
}

async function searchDocuments(query: string, category?: string, tag?: string) {
  const supabase = await createClient()

  let q = supabase
    .from("documents")
    .select(`*, category:categories(*)`)
    .eq("status", "published")

  if (query) {
    q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
  }

  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single()
    if (cat) q = q.eq("category_id", cat.id)
  }

  if (tag) {
    q = q.contains("tags", [tag])
  }

  const { data } = await q.order("published_at", { ascending: false }).limit(48)
  return (data || []) as (Document & { category: Category | null })[]
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", category, tag } = await searchParams
  const results = await searchDocuments(q, category, tag)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Search className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold">
              {q ? `Resultados para "${q}"` : tag ? `Etiqueta: ${tag}` : "Búsqueda"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              {results.length} {results.length === 1 ? "resultado" : "resultados"}
            </p>
            {tag && (
              <Badge variant="secondary">#{tag}</Badge>
            )}
          </div>
        </div>

        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold">No se encontraron resultados</h3>
            <p className="text-muted-foreground">
              Intenta con otras palabras clave o explora las categorías
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
