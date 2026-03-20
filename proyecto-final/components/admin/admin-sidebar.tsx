"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  FolderOpen,
  Layers,
  Users,
  MessageSquare,
  Settings,
  BarChart3,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Documentos", href: "/admin/documents", icon: FileText },
  { name: "Categorias", href: "/admin/categories", icon: FolderOpen },
  { name: "Series", href: "/admin/series", icon: Layers },
  { name: "Comentarios", href: "/admin/comments", icon: MessageSquare },
  { name: "Usuarios", href: "/admin/users", icon: Users },
  { name: "Estadisticas", href: "/admin/stats", icon: BarChart3 },
  { name: "Configuracion", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <BookOpen className="h-6 w-6 text-primary" />
        <span className="font-bold">Admin Panel</span>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <Button variant="outline" className="w-full justify-start gap-2" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Volver al sitio
          </Link>
        </Button>
      </div>
    </aside>
  )
}
