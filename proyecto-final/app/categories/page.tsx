import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import type { Category } from "@/lib/types"

export const metadata = {
  title: "Categorías | Biblioteca de Análisis",
  description: "Explora todas las categorías de análisis disponibles",
}

async function getCategories() {
  const supabase = await createClient()
  
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  // Get document count for each category
  const categoriesWithCount = await Promise.all(
    (categories || []).map(async (category) => {
      const { count } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("category_id", category.id)
        .eq("status", "published")

      return {
        ...category,
        documentCount: count || 0,
      }
    })
  )

  return categoriesWithCount
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif mb-2">Categorías</h1>
          <p className="text-muted-foreground">
            Explora análisis organizados por tema
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/category/${category.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                <div 
                  className="h-2" 
                  style={{ backgroundColor: category.color }}
                />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {category.documentCount} {category.documentCount === 1 ? "documento" : "documentos"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay categorías disponibles</p>
          </div>
        )}
      </main>
    </div>
  )
}
