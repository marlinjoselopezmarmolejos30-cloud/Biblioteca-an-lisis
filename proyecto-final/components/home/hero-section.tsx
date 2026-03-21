"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Category {
  name: string
  slug: string
}

export function HeroSection() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("categories")
      .select("name, slug")
      .order("order_index")
      .limit(5)
      .then(({ data }) => {
        if (data && data.length > 0) setCategories(data)
      })
  }, [])

  const debouncedPush = useCallback(
    (query: string) => {
      if (query.trim().length >= 2) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      }
    },
    [router]
  )

  useEffect(() => {
    const timer = setTimeout(() => debouncedPush(search), 400)
    return () => clearTimeout(timer)
  }, [search, debouncedPush])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-16 sm:py-24">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49%,var(--border)_50%,transparent_51%,transparent_100%)] bg-[length:60px_100%]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,transparent_49%,var(--border)_50%,transparent_51%,transparent_100%)] bg-[length:100%_60px]" />
      </div>

      {/* Glow effect */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
          <Sparkles className="h-4 w-4" />
          <span>Análisis profundos sobre temas complejos</span>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Tu Biblioteca de{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Conocimiento
          </span>
        </h1>

        {/* Description */}
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground text-pretty">
          Lee, comenta y debate análisis rigurosos sobre filosofía, historia, economía y más.
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mx-auto max-w-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar documentos, temas, etiquetas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-14 rounded-full bg-card pl-12 pr-32 text-base shadow-lg shadow-primary/5 focus-visible:ring-primary"
            />
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6"
            >
              Buscar
            </Button>
          </div>
        </form>

        {/* Dynamic category pills */}
        {categories.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Explorar:</span>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="rounded-full border border-border/60 bg-card px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
