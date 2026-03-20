"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, List } from "lucide-react"
import type { DocumentWithRelations, Series } from "@/lib/types"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface SeriesNavProps {
  documents: DocumentWithRelations[]
  currentId: string
  series: Series
}

export function SeriesNav({ documents, currentId, series }: SeriesNavProps) {
  const currentIndex = documents.findIndex((d) => d.id === currentId)
  const prevDoc = currentIndex > 0 ? documents[currentIndex - 1] : null
  const nextDoc = currentIndex < documents.length - 1 ? documents[currentIndex + 1] : null

  return (
    <div className="my-12 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Parte de la serie</p>
              <Link 
                href={`/series/${series.id}`}
                className="font-semibold hover:text-primary transition-colors"
              >
                {series.title}
              </Link>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <List className="w-4 h-4 mr-2" />
                  {currentIndex + 1} de {documents.length}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{series.title}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {documents.map((doc, index) => (
                    <Link
                      key={doc.id}
                      href={`/document/${doc.id}`}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        doc.id === currentId 
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className="flex-shrink-0 w-6 text-center font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="line-clamp-1">{doc.title}</span>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex gap-4">
            {prevDoc ? (
              <Link href={`/document/${prevDoc.id}`} className="flex-1">
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <ChevronLeft className="w-4 h-4 mr-2 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-xs text-muted-foreground">Anterior</p>
                    <p className="truncate">{prevDoc.title}</p>
                  </div>
                </Button>
              </Link>
            ) : (
              <div className="flex-1" />
            )}

            {nextDoc && (
              <Link href={`/document/${nextDoc.id}`} className="flex-1">
                <Button variant="outline" className="w-full justify-end h-auto py-3">
                  <div className="text-right min-w-0">
                    <p className="text-xs text-muted-foreground">Siguiente</p>
                    <p className="truncate">{nextDoc.title}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-2 flex-shrink-0" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
