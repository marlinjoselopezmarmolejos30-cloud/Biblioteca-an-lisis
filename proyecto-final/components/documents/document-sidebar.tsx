"use client"

import Link from "next/link"
import Image from "next/image"
import { BookOpen, ChevronRight, List } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { Document, Category, Series } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DocumentSidebarProps {
  document: Document & { category: Category | null; series: Series | null }
  seriesDocuments: Document[]
  relatedDocuments: (Document & { category: Category | null })[]
}

export function DocumentSidebar({
  document,
  seriesDocuments,
  relatedDocuments,
}: DocumentSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Series Info */}
      {document.series && seriesDocuments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">
                Parte de la Serie
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              href={`/series/${document.series.id}`}
              className="group mb-4 block"
            >
              <div className="flex items-start gap-3">
                {document.series.cover_url ? (
                  <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded">
                    <Image
                      src={document.series.cover_url}
                      alt={document.series.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-12 flex-shrink-0 items-center justify-center rounded bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <h4 className="font-medium group-hover:text-primary">
                    {document.series.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {seriesDocuments.length} documentos
                  </p>
                </div>
              </div>
            </Link>

            <Separator className="my-3" />

            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {seriesDocuments.map((doc, index) => (
                  <Link
                    key={doc.id}
                    href={`/document/${doc.id}`}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      doc.id === document.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent"
                    )}
                  >
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                      {index + 1}
                    </span>
                    <span className="line-clamp-1">{doc.title}</span>
                    {doc.id === document.id && (
                      <ChevronRight className="ml-auto h-3 w-3" />
                    )}
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Related Documents */}
      {relatedDocuments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Documentos Relacionados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {relatedDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/document/${doc.id}`}
                  className="group flex gap-3"
                >
                  <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded">
                    {doc.cover_url ? (
                      <Image
                        src={doc.cover_url}
                        alt={doc.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{
                          backgroundColor: doc.category?.color || "var(--primary)",
                        }}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="line-clamp-2 text-sm font-medium leading-tight group-hover:text-primary">
                      {doc.title}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {doc.views_count.toLocaleString()} vistas
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Info */}
      {document.category && (
        <Card>
          <CardContent className="p-4">
            <Link
              href={`/category/${document.category.slug}`}
              className="group flex items-center gap-3"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: document.category.color }}
              >
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium group-hover:text-primary">
                  {document.category.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Ver mas en esta categoria
                </p>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
