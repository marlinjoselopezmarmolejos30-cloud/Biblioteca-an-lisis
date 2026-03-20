import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { DocumentViewer } from "@/components/documents/document-viewer"
import type { DocumentWithRelations } from "@/lib/types"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: document } = await supabase
    .from("documents")
    .select(`*, category:categories(*)`)
    .eq("id", id)
    .single()

  if (!document) {
    return { title: "Documento no encontrado" }
  }

  return {
    title: `${document.title} | Biblioteca de Análisis`,
    description: document.description || `Lee ${document.title}`,
    openGraph: {
      title: document.title,
      description: document.description || undefined,
      images: document.cover_url ? [document.cover_url] : undefined,
    },
  }
}

async function getDocument(id: string) {
  const supabase = await createClient()
  
  const { data: document } = await supabase
    .from("documents")
    .select(`*, category:categories(*), series:series(*)`)
    .eq("id", id)
    .single()

  if (!document || document.status !== "published") return null

  // Increment view count via RPC
  await supabase.rpc("increment_views", { doc_id: id })

  // Get series documents if part of a series
  let seriesDocuments: DocumentWithRelations[] = []
  if (document.series_id) {
    const { data } = await supabase
      .from("documents")
      .select(`*, category:categories(*), series:series(*)`)
      .eq("series_id", document.series_id)
      .eq("status", "published")
      .order("series_order", { ascending: true })
    
    seriesDocuments = (data || []) as DocumentWithRelations[]
  }

  return {
    document: document as DocumentWithRelations,
    seriesDocuments,
  }
}

export default async function DocumentPage({ params }: Props) {
  const { id } = await params
  const data = await getDocument(id)

  if (!data) {
    notFound()
  }

  const { document, seriesDocuments } = data

  return (
    <DocumentViewer 
      document={document}
      seriesDocuments={seriesDocuments}
    />
  )
}
