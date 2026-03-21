import Link from "next/link"
import { BookOpen, Home, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Animated number */}
      <div className="mb-6 select-none">
        <span className="bg-gradient-to-br from-primary/30 via-primary/60 to-primary/30 bg-clip-text text-[8rem] font-black leading-none tracking-tight text-transparent sm:text-[12rem]">
          404
        </span>
      </div>

      <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />

      <h1 className="mb-2 text-2xl font-bold">Página no encontrada</h1>
      <p className="mb-8 max-w-sm text-muted-foreground">
        El documento o la página que buscas no existe o fue movido.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Ir al inicio
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/search">
            <Search className="mr-2 h-4 w-4" />
            Buscar documentos
          </Link>
        </Button>
      </div>

      <BackButton />
    </div>
  )
}
