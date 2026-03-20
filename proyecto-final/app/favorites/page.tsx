import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DocumentCard } from "@/components/documents/document-card"
import { Heart } from "lucide-react"

export const metadata = {
  title: "Mis Favoritos | Biblioteca de Analisis",
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

  const documents = favorites
    ?.map((f) => f.document)
    .filter(Boolean) || []

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Heart className="h-8 w-8 text-red-500" />
          Mis Favoritos
        </h1>
        <p className="mt-2 text-muted-foreground">
          Documentos que has guardado para leer mas tarde
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="py-16 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">No tienes favoritos</h2>
          <p className="mt-2 text-muted-foreground">
            Guarda documentos para acceder a ellos rapidamente
          </p>
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
