import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Eye, MessageSquare, Clock, ChevronRight } from "lucide-react"
import type { DocumentWithRelations, Series } from "@/lib/types"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: series } = await supabase
    .from("series")
    .select("*")
    .eq("id", id)
    .single()

  if (!series) {
    return { title: "Serie no encontrada" }
  }

  return {
    title: `${series.title} | Biblioteca de Análisis`,
    description: series.description || `Serie: ${series.title}`,
  }
}

async function getSeriesData(id: string) {
  const supabase = await createClient()
  
  const { data: series } = await supabase
    .from("series")
    .select("*")
    .eq("id", id)
    .single()

  if (!series) return null

  const { data: documents } = await supabase
    .from("documents")
    .select(`
      *,
      category:categories(*),
      series:series(*)
    `)
    .eq("status", "published")
    .eq("series_id", series.id)
    .order("series_order", { ascending: true })

  return {
    series: series as Series,
    documents: (documents || []) as DocumentWithRelations[],
  }
}

export default async function SeriesDetailPage({ params }: Props) {
  const { id } = await params
  const data = await getSeriesData(id)

  if (!data) {
    notFound()
  }

  const { series, documents } = data

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Series Header */}
        <div className="relative py-16 md:py-24">
          {series.cover_url && (
            <div className="absolute inset-0">
              <Image
                src={series.cover_url}
                alt={series.title}
                fill
                className="object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60" />
            </div>
          )}
          
          <div className="container mx-auto px-4 relative">
            <Badge variant="secondary" className="mb-4">
              Serie - {documents.length} {documents.length === 1 ? "episodio" : "episodios"}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4">
              {series.title}
            </h1>
            {series.description && (
              <p className="text-lg text-muted-foreground max-w-2xl">
                {series.description}
              </p>
            )}
          </div>
        </div>

        {/* Episodes List */}
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-semibold mb-6">Episodios</h2>
          
          <div className="space-y-4">
            {documents.map((doc, index) => (
              <Link key={doc.id} href={`/document/${doc.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* Episode Number */}
                      <div className="flex-shrink-0 w-16 md:w-20 bg-muted flex items-center justify-center">
                        <span className="text-2xl md:text-3xl font-bold text-muted-foreground">
                          {(index + 1).toString().padStart(2, "0")}
                        </span>
                      </div>
                      
                      {/* Thumbnail */}
                      <div className="relative w-32 md:w-48 flex-shrink-0">
                        {doc.cover_url ? (
                          <Image
                            src={doc.cover_url}
                            alt={doc.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: `${doc.category?.color || "#6366f1"}20` }}
                          >
                            <span 
                              className="text-2xl font-serif font-bold opacity-30"
                              style={{ color: doc.category?.color || "#6366f1" }}
                            >
                              {doc.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 p-4 md:p-6 flex flex-col justify-center min-w-0">
                        <h3 className="font-semibold text-lg md:text-xl mb-2 group-hover:text-primary transition-colors line-clamp-1">
                          {doc.title}
                        </h3>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 hidden md:block">
                            {doc.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {doc.views_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {doc.comments_count}
                          </span>
                          {doc.estimated_read_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {doc.estimated_read_time} min
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <div className="flex-shrink-0 flex items-center pr-4 text-muted-foreground group-hover:text-primary transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {documents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No hay episodios en esta serie
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
