"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Star,
  StarOff,
} from "lucide-react"
import { toast } from "sonner"
import type { Document } from "@/lib/types"

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const supabase = createClient()

  useEffect(() => {
    fetchDocuments()
  }, [])

  async function fetchDocuments() {
    setLoading(true)
    const { data, error } = await supabase
      .from("documents")
      .select(`*, category:categories(name, color)`)
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Error al cargar documentos")
    } else {
      setDocuments(data || [])
    }
    setLoading(false)
  }

  async function toggleFeatured(id: string, current: boolean) {
    const { error } = await supabase
      .from("documents")
      .update({ is_featured: !current })
      .eq("id", id)

    if (error) {
      toast.error("Error al actualizar")
    } else {
      toast.success(current ? "Quitado de destacados" : "Marcado como destacado")
      fetchDocuments()
    }
  }

  async function deleteDocument(id: string) {
    if (!confirm("¿Estas seguro de eliminar este documento?")) return

    const { error } = await supabase.from("documents").delete().eq("id", id)

    if (error) {
      toast.error("Error al eliminar")
    } else {
      toast.success("Documento eliminado")
      fetchDocuments()
    }
  }

  const filteredDocs = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">Gestiona todos los documentos de la plataforma</p>
        </div>
        <Button asChild>
          <Link href="/admin/documents/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Documento
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
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
                <TableHead>Titulo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Vistas</TableHead>
                <TableHead className="text-right">Comentarios</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No hay documentos
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {doc.is_featured && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString("es")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.category && (
                        <Badge
                          variant="outline"
                          style={{ borderColor: doc.category.color, color: doc.category.color }}
                        >
                          {doc.category.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={doc.status === "published" ? "default" : "secondary"}>
                        {doc.status === "published" ? "Publicado" : doc.status === "draft" ? "Borrador" : "Programado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{doc.views_count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{doc.comments_count}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/document/${doc.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/documents/${doc.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleFeatured(doc.id, doc.is_featured)}>
                            {doc.is_featured ? (
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
                            onClick={() => deleteDocument(doc.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
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
