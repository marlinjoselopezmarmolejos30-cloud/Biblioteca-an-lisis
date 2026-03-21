import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import type { Series } from "@/lib/types"

export const metadata = {
  title: "Series | Biblioteca de Análisis",
  description: "Explora colecciones temáticas de análisis",
}

async function getSeries() {
  const supabase = await createClient()
  
  const { data: series } = await supabase
    .from("series")
    .select("*")
    .order("order_index")

  // Get document count for each series
  const seriesWithCount = await Promise.all(
    (series || []).map(async (s) => {
      const { count } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("series_id", s.id)
        .eq("status", "published")

      return {
        ...s,
        documentCount: count || 0,
      }
    })
  )

  return seriesWithCount
}

export default async function SeriesPage() {
  const series = await getSeries()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif mb-2">Series temáticas</h1>
          <p className="text-muted-foreground">
            Colecciones de análisis organizados en secuencia
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {series.map((s) => (
            <Link key={s.id} href={`/series/${s.id}`}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                <div className="relative aspect-video">
                  {s.cover_url ? (
                    <Image
                      src={s.cover_url}
                      alt={s.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-4xl font-serif font-bold text-primary/30">
                        {s.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                      {s.documentCount} {s.documentCount === 1 ? "episodio" : "episodios"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {s.title}
                  </h2>
                  {s.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {s.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {series.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay series disponibles</p>
          </div>
        )}
      </main>
    </div>
  )
}
