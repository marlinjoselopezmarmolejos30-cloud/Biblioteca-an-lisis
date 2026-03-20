import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DocumentCard } from "@/components/documents/document-card"
import { History } from "lucide-react"

export const metadata = {
  title: "Historial de Lectura | Biblioteca de Analisis",
}

export default async function HistoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: history } = await supabase
    .from("reading_history")
    .select(`
      progress,
      last_read_at,
      document:documents(
        *,
        category:categories(name, slug, color)
      )
    `)
    .eq("user_id", user.id)
    .order("last_read_at", { ascending: false })

  const documents = history
    ?.map((h) => ({ ...h.document, progress: h.progress }))
    .filter(Boolean) || []

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <History className="h-8 w-8" />
          Historial de Lectura
        </h1>
        <p className="mt-2 text-muted-foreground">
          Documentos que has leido recientemente
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="py-16 text-center">
          <History className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">Sin historial</h2>
          <p className="mt-2 text-muted-foreground">
            Los documentos que leas apareceran aqui
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
