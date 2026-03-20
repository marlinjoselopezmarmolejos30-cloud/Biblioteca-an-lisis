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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Search, MoreHorizontal, Eye, Trash2, Star, StarOff } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface CommentWithDetails {
  id: string
  content: string
  created_at: string
  is_highlighted: boolean
  is_deleted: boolean
  document: { id: string; title: string } | null
  user: { display_name: string; email: string } | null
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const supabase = createClient()

  useEffect(() => {
    fetchComments()
  }, [])

  async function fetchComments() {
    setLoading(true)
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        document:documents(id, title),
        user:profiles(display_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      toast.error("Error al cargar comentarios")
    } else {
      setComments(data || [])
    }
    setLoading(false)
  }

  async function toggleHighlight(id: string, current: boolean) {
    const { error } = await supabase
      .from("comments")
      .update({ is_highlighted: !current })
      .eq("id", id)

    if (error) {
      toast.error("Error al actualizar")
    } else {
      toast.success(current ? "Quitado de destacados" : "Comentario destacado")
      fetchComments()
    }
  }

  async function deleteComment(id: string) {
    if (!confirm("¿Estas seguro de eliminar este comentario?")) return

    const { error } = await supabase
      .from("comments")
      .update({ is_deleted: true })
      .eq("id", id)

    if (error) {
      toast.error("Error al eliminar")
    } else {
      toast.success("Comentario eliminado")
      fetchComments()
    }
  }

  const filteredComments = comments.filter(
    (comment) =>
      comment.content.toLowerCase().includes(search.toLowerCase()) ||
      comment.user?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      comment.document?.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Comentarios</h1>
        <p className="text-muted-foreground">Modera los comentarios de la plataforma</p>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar comentarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
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
                  <TableRow key={comment.id} className={comment.is_deleted ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        {comment.is_highlighted && (
                          <Star className="mt-0.5 h-4 w-4 shrink-0 fill-yellow-500 text-yellow-500" />
                        )}
                        <p className="line-clamp-2 text-sm">{comment.content}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {comment.user?.display_name || "Usuario eliminado"}
                    </TableCell>
                    <TableCell>
                      {comment.document ? (
                        <Link
                          href={`/document/${comment.document.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {comment.document.title.slice(0, 30)}...
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">Documento eliminado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {comment.is_deleted ? (
                        <Badge variant="destructive">Eliminado</Badge>
                      ) : comment.is_highlighted ? (
                        <Badge variant="default">Destacado</Badge>
                      ) : (
                        <Badge variant="outline">Visible</Badge>
                      )}
                    </TableCell>
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
                            <DropdownMenuItem asChild>
                              <Link href={`/document/${comment.document.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver documento
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => toggleHighlight(comment.id, comment.is_highlighted)}
                          >
                            {comment.is_highlighted ? (
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
                          {!comment.is_deleted && (
                            <DropdownMenuItem
                              onClick={() => deleteComment(comment.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
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
