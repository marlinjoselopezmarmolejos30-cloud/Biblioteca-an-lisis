import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DocumentCard } from "@/components/documents/document-card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { History, Clock, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import type { Document, Category } from "@/lib/types"

export const metadata = {
  title: "Historial de Lectura | Biblioteca de Análisis",
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

  type HistoryEntry = {
    document: (Document & { category: Category | null }) | null
    progress: number
    last_read_at: string
  }

  const entries: HistoryEntry[] = (history || []).filter(
    (h): h is { document: Document & { category: Category | null }; progress: number; last_read_at: string } =>
      h.document != null
  )

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <History className="h-8 w-8" />
            Historial de Lectura
          </h1>
          <p className="mt-2 text-muted-foreground">
            {entries.length} {entries.length === 1 ? "documento leído" : "documentos leídos"}
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <History className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">Sin historial</h2>
          <p className="mt-2 text-muted-foreground">
            Los documentos que leas aparecerán aquí
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Explorar documentos</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(({ document: doc, progress, last_read_at }) => (
            <Link
              key={doc!.id}
              href={`/document/${doc!.id}`}
              className="group flex gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
            >
              {/* Cover */}
              {doc!.cover_url ? (
                <img
                  src={doc!.cover_url}
                  alt={doc!.title}
                  className="h-20 w-32 flex-shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="h-20 w-32 flex-shrink-0 rounded-lg"
                  style={{ backgroundColor: `${doc!.category?.color || "#6366f1"}30` }}
                />
              )}

              {/* Content */}
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <h3 className="line-clamp-1 font-semibold group-hover:text-primary">
                    {doc!.title}
                  </h3>
                  {doc!.category && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{doc!.category.name}</p>
                  )}
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Math.round(progress)}% leído</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(last_read_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
