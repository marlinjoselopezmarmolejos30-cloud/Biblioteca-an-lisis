import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DocumentCard } from "@/components/documents/document-card"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import Link from "next/link"
import type { Document, Category } from "@/lib/types"

export const metadata = {
  title: "Mis Favoritos | Biblioteca de Análisis",
}

export default async function FavoritesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: favorites } = await supabase
    .from("favorites")
    .select(`
      document:documents(
        *,
        category:categories(name, slug, color)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  type FavDocument = Document & { category: Category | null }

  const documents: FavDocument[] = (favorites || [])
    .map((f) => f.document)
    .filter((d): d is FavDocument => d != null)

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Heart className="h-8 w-8 text-red-500" />
          Mis Favoritos
        </h1>
        <p className="mt-2 text-muted-foreground">
          {documents.length} {documents.length === 1 ? "documento guardado" : "documentos guardados"}
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">Sin favoritos aún</h2>
          <p className="mt-2 text-muted-foreground">
            Guarda documentos para acceder a ellos rápidamente
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Explorar documentos</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}
    </main>
  )
}
