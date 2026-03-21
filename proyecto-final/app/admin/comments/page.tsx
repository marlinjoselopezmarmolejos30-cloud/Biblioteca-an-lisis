"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Search, MoreHorizontal, Eye, Trash2, Star, StarOff } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type CommentStatus = "visible" | "hidden" | "featured"

interface CommentWithDetails {
  id: string
  content: string
  created_at: string
  status: CommentStatus
  likes_count: number
  document: { id: string; title: string } | null
  user: { display_name: string | null; email: string } | null
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<CommentStatus | "all">("all")
  const supabase = createClient()

  useEffect(() => {
    fetchComments()
  }, [])

  async function fetchComments() {
    setLoading(true)
    const { data, error } = await supabase
      .from("comments")
      .select(`
        id, content, created_at, status, likes_count,
        document:documents(id, title),
        user:profiles(display_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) {
      toast.error("Error al cargar comentarios")
    } else {
      setComments(data as CommentWithDetails[] || [])
    }
    setLoading(false)
  }

  async function toggleFeature(id: string, currentStatus: CommentStatus) {
    const newStatus: CommentStatus = currentStatus === "featured" ? "visible" : "featured"
    const { error } = await supabase
      .from("comments")
      .update({ status: newStatus })
      .eq("id", id)

    if (error) {
      toast.error("Error al actualizar")
    } else {
      toast.success(newStatus === "featured" ? "Comentario destacado" : "Comentario quitado de destacados")
      fetchComments()
    }
  }

  async function toggleHide(id: string, currentStatus: CommentStatus) {
    const newStatus: CommentStatus = currentStatus === "hidden" ? "visible" : "hidden"
    const { error } = await supabase
      .from("comments")
      .update({ status: newStatus })
      .eq("id", id)

    if (error) {
      toast.error("Error al actualizar")
    } else {
      toast.success(newStatus === "hidden" ? "Comentario ocultado" : "Comentario restaurado")
      fetchComments()
    }
  }

  const filteredComments = comments.filter((comment) => {
    const matchesSearch =
      comment.content.toLowerCase().includes(search.toLowerCase()) ||
      comment.user?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      comment.document?.title?.toLowerCase().includes(search.toLowerCase())

    const matchesFilter = filter === "all" || comment.status === filter

    return matchesSearch && matchesFilter
  })

  const statusBadge = (status: CommentStatus) => {
    if (status === "hidden") return <Badge variant="destructive">Oculto</Badge>
    if (status === "featured") return <Badge className="bg-yellow-500 text-white">Destacado</Badge>
    return <Badge variant="outline">Visible</Badge>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Comentarios</h1>
        <p className="text-muted-foreground">Modera los comentarios de la plataforma</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por contenido, usuario o documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "visible", "featured", "hidden"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todos" : f === "visible" ? "Visibles" : f === "featured" ? "Destacados" : "Ocultos"}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Contenido</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No hay comentarios
                  </TableCell>
                </TableRow>
              ) : (
                filteredComments.map((comment) => (
                  <TableRow
                    key={comment.id}
                    className={comment.status === "hidden" ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <div className="flex items-start gap-2">
                        {comment.status === "featured" && (
                          <Star className="mt-0.5 h-4 w-4 shrink-0 fill-yellow-500 text-yellow-500" />
                        )}
                        <p className="line-clamp-2 text-sm">{comment.content}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {comment.user?.display_name || comment.user?.email || "Usuario eliminado"}
                    </TableCell>
                    <TableCell>
                      {comment.document ? (
                        <Link
                          href={`/document/${comment.document.id}`}
                          className="text-sm text-primary hover:underline line-clamp-1 max-w-[160px] block"
                        >
                          {comment.document.title}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">Documento eliminado</span>
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(comment.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString("es")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {comment.document && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/document/${comment.document.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver documento
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => toggleFeature(comment.id, comment.status)}>
                            {comment.status === "featured" ? (
                              <>
                                <StarOff className="mr-2 h-4 w-4" />
                                Quitar destacado
                              </>
                            ) : (
                              <>
                                <Star className="mr-2 h-4 w-4" />
                                Destacar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleHide(comment.id, comment.status)}
                            className={comment.status === "hidden" ? "" : "text-destructive focus:text-destructive"}
                          >
                            {comment.status === "hidden" ? (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Restaurar
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Ocultar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
