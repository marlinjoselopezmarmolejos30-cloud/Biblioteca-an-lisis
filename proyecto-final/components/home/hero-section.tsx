"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-16 sm:py-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49%,var(--border)_50%,transparent_51%,transparent_100%)] bg-[length:60px_100%]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,transparent_49%,var(--border)_50%,transparent_51%,transparent_100%)] bg-[length:100%_60px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
          <Sparkles className="h-4 w-4" />
          <span>Explora analisis profundos</span>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Tu Biblioteca de{" "}
          <span className="text-primary">Conocimiento</span>
        </h1>

        {/* Description */}
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground text-pretty">
          Descubre analisis profundos sobre filosofia, ciencia, historia y mas. 
          Lee, comenta y participa en debates enriquecedores.
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mx-auto max-w-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar documentos, categorias, etiquetas..."
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

        {/* Quick Links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">Populares:</span>
          <Button variant="link" size="sm" className="h-auto p-0" asChild>
            <a href="/category/filosofia">Filosofia</a>
          </Button>
          <Button variant="link" size="sm" className="h-auto p-0" asChild>
            <a href="/category/ciencia">Ciencia</a>
          </Button>
          <Button variant="link" size="sm" className="h-auto p-0" asChild>
            <a href="/category/historia">Historia</a>
          </Button>
          <Button variant="link" size="sm" className="h-auto p-0" asChild>
            <a href="/category/tecnologia">Tecnologia</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
