"use client"

import { useRef } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocumentCard } from "./document-card"
import type { Document, Category } from "@/lib/types"

interface DocumentRowProps {
  title: string
  documents: (Document & { category?: Category | null })[]
  href?: string
  variant?: "default" | "featured"
}

export function DocumentRow({ title, documents, href, variant = "default" }: DocumentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const scrollAmount = scrollRef.current.clientWidth * 0.75
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  if (documents.length === 0) return null

  return (
    <section className="relative">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          {href && (
            <Link
              href={href}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Ver todo
            </Link>
          )}
        </div>
        
        {/* Scroll Buttons - Desktop */}
        <div className="hidden gap-2 sm:flex">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Anterior</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Siguiente</span>
          </Button>
        </div>
      </div>

      {/* Scrollable Row */}
      <div
        ref={scrollRef}
        className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide sm:-mx-0 sm:px-0"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={
              variant === "featured"
                ? "w-[85vw] flex-shrink-0 sm:w-[600px]"
                : "w-[280px] flex-shrink-0 sm:w-[300px]"
            }
            style={{ scrollSnapAlign: "start" }}
          >
            <DocumentCard 
              document={doc} 
              variant={variant === "featured" ? "featured" : "default"} 
            />
          </div>
        ))}
      </div>
    </section>
  )
}
