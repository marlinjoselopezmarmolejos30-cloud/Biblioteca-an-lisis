"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  BookmarkCheck,
  MessageCircle, 
  Eye, 
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CommentsSection } from "@/components/comments/comments-section"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Document, Category, Series } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DocumentViewerProps {
  document: Document & { category: Category | null; series: Series | null }
  seriesDocuments: { id: string; title: string; series_order: number | null }[]
}

export function DocumentViewer({ document, seriesDocuments }: DocumentViewerProps) {
  const router = useRouter()
  const { user } = useAuth()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [progress, setProgress] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [copied, setCopied] = useState(false)

  const supabase = createClient()

  // Check if document is in favorites
  useEffect(() => {
    if (!user) return

    async function checkFavorite() {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user!.id)
        .eq("document_id", document.id)
        .single()

      setIsFavorite(!!data)
    }

    checkFavorite()
  }, [user, document.id, supabase])

  // Track reading progress
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return

    const updateProgress = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) return

      const scrollTop = iframeDoc.documentElement.scrollTop || iframeDoc.body.scrollTop
      const scrollHeight = iframeDoc.documentElement.scrollHeight || iframeDoc.body.scrollHeight
      const clientHeight = iframeDoc.documentElement.clientHeight || iframeDoc.body.clientHeight
      
      const scrollProgress = (scrollTop / (scrollHeight - clientHeight)) * 100
      setProgress(Math.min(100, Math.max(0, scrollProgress)))
    }

    iframe.contentWindow.addEventListener("scroll", updateProgress)
    updateProgress()

    return () => {
      iframe.contentWindow?.removeEventListener("scroll", updateProgress)
    }
  }, [])

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!user) {
      toast.error("Inicia sesion para guardar favoritos")
      return
    }

    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("document_id", document.id)

      setIsFavorite(false)
      toast.success("Eliminado de favoritos")
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id,
        document_id: document.id,
      })

      setIsFavorite(true)
      toast.success("Agregado a favoritos")
    }
  }

  // Share document
  const shareDocument = async () => {
    const url = window.location.href

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copiado al portapapeles")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar el link")
    }
  }

  // Find current position in series
  const currentIndex = seriesDocuments.findIndex((d) => d.id === document.id)
  const prevDoc = currentIndex > 0 ? seriesDocuments[currentIndex - 1] : null
  const nextDoc = currentIndex < seriesDocuments.length - 1 ? seriesDocuments[currentIndex + 1] : null

  return (
    <div ref={containerRef} className="flex min-h-screen flex-col bg-background">
      {/* Top Bar */}
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur transition-all duration-300",
          isMinimized ? "h-12" : "h-auto"
        )}
      >
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>

          {/* Title - centered */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="max-w-md truncate text-sm font-medium">
              {document.title}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              className={cn(isFavorite && "text-primary")}
            >
              {isFavorite ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={shareDocument}>
              {copied ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Share2 className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowComments(!showComments)}
              className={cn(showComments && "bg-accent")}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-1 rounded-none" />

        {/* Document Info - collapsible */}
        {!isMinimized && (
          <div className="border-t border-border bg-card/50 px-4 py-3">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {document.category && (
                  <Badge variant="secondary">{document.category.name}</Badge>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {document.views_count.toLocaleString()} vistas
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {document.comments_count} comentarios
                </span>
                {document.estimated_read_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {document.estimated_read_time} min lectura
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Document Content */}
        <main className={cn("flex-1 transition-all", showComments && "lg:mr-96")}>
          {/* Series Navigation */}
          {document.series && seriesDocuments.length > 1 && (
            <div className="border-b border-border bg-accent/30 px-4 py-2">
              <div className="mx-auto flex max-w-4xl items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Serie: </span>
                  <Link
                    href={`/series/${document.series.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {document.series.title}
                  </Link>
                  <span className="ml-2 text-muted-foreground">
                    ({currentIndex + 1} de {seriesDocuments.length})
                  </span>
                </div>
                <div className="flex gap-2">
                  {prevDoc && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/document/${prevDoc.id}`}>
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Anterior
                      </Link>
                    </Button>
                  )}
                  {nextDoc && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/document/${nextDoc.id}`}>
                        Siguiente
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* iframe for HTML content */}
          <div className="relative h-[calc(100vh-8rem)]">
            <iframe
              ref={iframeRef}
              src={document.content_url}
              className="h-full w-full border-0"
              onLoad={handleIframeLoad}
              sandbox="allow-same-origin allow-scripts"
              title={document.title}
            />
          </div>

          {/* Bottom: Comments Section (Mobile) */}
          <div className="lg:hidden">
            <Separator />
            <CommentsSection documentId={document.id} />
          </div>
        </main>

        {/* Comments Sidebar (Desktop) */}
        {showComments && (
          <aside className="fixed right-0 top-0 z-40 hidden h-screen w-96 border-l border-border bg-background lg:block">
            <div className="flex h-12 items-center justify-between border-b border-border px-4">
              <h2 className="font-semibold">Comentarios</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowComments(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-3rem)]">
              <CommentsSection documentId={document.id} />
            </ScrollArea>
          </aside>
        )}
      </div>
    </div>
  )
}
