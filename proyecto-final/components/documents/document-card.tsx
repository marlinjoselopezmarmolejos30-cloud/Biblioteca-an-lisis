"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, MessageCircle, Clock, Bookmark, Tag } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Document, Category } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface DocumentCardProps {
  document: Document & { category?: Category | null }
  variant?: "default" | "compact" | "featured"
  initialFavorited?: boolean
}

const categoryColors: Record<string, string> = {
  filosofia: "bg-[oklch(0.55_0.18_280)] dark:bg-[oklch(0.70_0.15_280)]",
  ciencia: "bg-[oklch(0.55_0.15_200)] dark:bg-[oklch(0.70_0.12_200)]",
  historia: "bg-[oklch(0.55_0.15_50)] dark:bg-[oklch(0.70_0.12_50)]",
  politica: "bg-[oklch(0.55_0.18_25)] dark:bg-[oklch(0.70_0.15_25)]",
  economia: "bg-[oklch(0.55_0.15_145)] dark:bg-[oklch(0.70_0.12_145)]",
  arte: "bg-[oklch(0.55_0.18_330)] dark:bg-[oklch(0.70_0.15_330)]",
  literatura: "bg-[oklch(0.55_0.12_85)] dark:bg-[oklch(0.70_0.10_85)]",
  tecnologia: "bg-[oklch(0.55_0.15_250)] dark:bg-[oklch(0.70_0.12_250)]",
  psicologia: "bg-[oklch(0.55_0.18_310)] dark:bg-[oklch(0.70_0.15_310)]",
}

export function DocumentCard({ document, variant = "default", initialFavorited = false }: DocumentCardProps) {
  const categorySlug = document.category?.slug || "default"
  const categoryColor = categoryColors[categorySlug] || "bg-primary"
  const [favorited, setFavorited] = useState(initialFavorited)
  const [favLoading, setFavLoading] = useState(false)

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (favLoading) return
    setFavLoading(true)
    const next = !favorited
    setFavorited(next) // optimistic
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: document.id }),
      })
      if (res.status === 401) {
        setFavorited(!next)
        toast.error("Inicia sesión para guardar favoritos")
        return
      }
      if (!res.ok) throw new Error()
      toast.success(next ? "Guardado en favoritos" : "Eliminado de favoritos")
    } catch {
      setFavorited(!next) // revert
      toast.error("Error al actualizar favoritos")
    } finally {
      setFavLoading(false)
    }
  }

  if (variant === "featured") {
    return (
      <Link href={`/document/${document.id}`} className="group block">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-card to-accent/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
          <div className="relative aspect-[16/9] overflow-hidden">
            {document.cover_url ? (
              <Image
                src={document.cover_url}
                alt={document.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className={cn("h-full w-full", categoryColor)} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {document.category && (
                <Badge className={cn("mb-3 text-white", categoryColor)}>
                  {document.category.name}
                </Badge>
              )}
              <h3 className="mb-2 text-2xl font-bold text-white text-balance">
                {document.title}
              </h3>
              {document.description && (
                <p className="line-clamp-2 text-sm text-white/80">
                  {document.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-white/60">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {document.views_count.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {document.comments_count}
                </span>
                {document.estimated_read_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {document.estimated_read_time} min
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    )
  }

  if (variant === "compact") {
    return (
      <Link href={`/document/${document.id}`} className="group block">
        <div className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
          <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md">
            {document.cover_url ? (
              <Image
                src={document.cover_url}
                alt={document.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className={cn("h-full w-full", categoryColor)} />
            )}
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <h4 className="line-clamp-1 font-medium group-hover:text-primary">
              {document.title}
            </h4>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {document.views_count.toLocaleString()}
              </span>
              {document.estimated_read_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {document.estimated_read_time} min
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Default variant
  return (
    <Link href={`/document/${document.id}`} className="group block">
      <Card className="h-full overflow-hidden border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <div className="relative aspect-[16/10] overflow-hidden">
          {document.cover_url ? (
            <Image
              src={document.cover_url}
              alt={document.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={cn("h-full w-full", categoryColor)} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-2 top-2 h-8 w-8 backdrop-blur-sm transition-all",
              "bg-black/20 text-white hover:bg-black/40",
              favorited
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            )}
            onClick={handleFavorite}
            disabled={favLoading}
            aria-label={favorited ? "Quitar de favoritos" : "Guardar en favoritos"}
          >
            <Bookmark
              className={cn("h-4 w-4 transition-all", favorited && "fill-white")}
            />
          </Button>
        </div>
        <CardContent className="p-4">
          {document.category && (
            <Badge
              variant="secondary"
              className={cn("mb-2 text-xs text-white", categoryColor)}
            >
              {document.category.name}
            </Badge>
          )}
          <h3 className="mb-1.5 line-clamp-2 font-semibold leading-tight text-balance group-hover:text-primary">
            {document.title}
          </h3>
          {document.description && (
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
              {document.description}
            </p>
          )}

          {/* Clickable tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {document.tags.slice(0, 3).map((tag) => (
                <Link
                  key={tag}
                  href={`/search?tag=${encodeURIComponent(tag)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-0.5 rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {document.views_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {document.comments_count}
            </span>
            {document.estimated_read_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {document.estimated_read_time} min
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
