import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { DocumentCard } from "@/components/document-card"
import { notFound } from "next/navigation"
import type { DocumentWithRelations, Category } from "@/lib/types"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!category) {
    return { title: "Categoría no encontrada" }
  }

  return {
    title: `${category.name} | Biblioteca de Análisis`,
    description: category.description || `Análisis sobre ${category.name}`,
  }
}

async function getCategoryData(slug: string) {
  const supabase = await createClient()
  
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!category) return null

  const { data: documents } = await supabase
    .from("documents")
    .select(`
      *,
      category:categories(*),
      series:series(*)
    `)
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })

  return {
    category: category as Category,
    documents: (documents || []) as DocumentWithRelations[],
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const data = await getCategoryData(slug)

  if (!data) {
    notFound()
  }

  const { category, documents } = data

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-1 h-8 rounded-full" 
              style={{ backgroundColor: category.color }}
            />
            <h1 className="text-3xl font-bold font-serif">{category.name}</h1>
          </div>
          {category.description && (
            <p className="text-muted-foreground ml-4">
              {category.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>

        {documents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay documentos en esta categoría
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
