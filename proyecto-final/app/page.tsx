import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { HeroSection } from "@/components/home/hero-section"
import { DocumentRow } from "@/components/documents/document-row"
import { CategorySection } from "@/components/documents/category-section"
import type { Document, Category } from "@/lib/types"

async function getHomeData() {
  const supabase = await createClient()

  // Fetch featured documents
  const { data: featured } = await supabase
    .from("documents")
    .select(`*, category:categories(*)`)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(6)

  // Fetch recent documents
  const { data: recent } = await supabase
    .from("documents")
    .select(`*, category:categories(*)`)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(12)

  // Fetch categories with their documents
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("order_index")

  // Fetch documents grouped by category
  const categoriesWithDocs = await Promise.all(
    (categories || []).map(async (category) => {
      const { data: docs } = await supabase
        .from("documents")
        .select(`*, category:categories(*)`)
        .eq("status", "published")
        .eq("category_id", category.id)
        .order("published_at", { ascending: false })
        .limit(8)

      return {
        category,
        documents: docs || [],
      }
    })
  )

  return {
    featured: (featured || []) as (Document & { category: Category | null })[],
    recent: (recent || []) as (Document & { category: Category | null })[],
    categoriesWithDocs: categoriesWithDocs.filter((c) => c.documents.length > 0),
  }
}

export default async function HomePage() {
  const { featured, recent, categoriesWithDocs } = await getHomeData()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <HeroSection />

        <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
          {/* Featured Documents */}
          {featured.length > 0 && (
            <DocumentRow
              title="Destacados por el Editor"
              documents={featured}
              variant="featured"
            />
          )}

          {/* Recent Documents */}
          {recent.length > 0 && (
            <DocumentRow
              title="Publicados Recientemente"
              documents={recent}
              href="/recent"
            />
          )}

          {/* Documents by Category */}
          {categoriesWithDocs.map(({ category, documents }) => (
            <CategorySection
              key={category.id}
              category={category}
              documents={documents}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Biblioteca de Analisis. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Terminos</a>
              <a href="#" className="hover:text-foreground">Privacidad</a>
              <a href="#" className="hover:text-foreground">Contacto</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
