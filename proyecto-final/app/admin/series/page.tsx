"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Pencil, Trash2, Layers } from "lucide-react"
import { toast } from "sonner"
import type { Series } from "@/lib/types"

interface SeriesWithCount extends Series {
  documents: { count: number }[]
}

export default function AdminSeriesPage() {
  const [series, setSeries] = useState<SeriesWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  const [formData, setFormData] = useState({ title: "", description: "", cover_url: "" })
  const supabase = createClient()

  useEffect(() => {
    fetchSeries()
  }, [])

  async function fetchSeries() {
    setLoading(true)
    const { data, error } = await supabase
      .from("series")
      .select(`*, documents(count)`)
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Error al cargar series")
    } else {
      setSeries(data || [])
    }
    setLoading(false)
  }

  function openDialog(s?: Series) {
    if (s) {
      setEditingSeries(s)
      setFormData({
        title: s.title,
        description: s.description || "",
        cover_url: s.cover_url || "",
      })
    } else {
      setEditingSeries(null)
      setFormData({ title: "", description: "", cover_url: "" })
    }
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title) {
      toast.error("El titulo es obligatorio")
      return
    }

    if (editingSeries) {
      const { error } = await supabase
        .from("series")
        .update(formData)
        .eq("id", editingSeries.id)

      if (error) {
        toast.error("Error al actualizar")
      } else {
        toast.success("Serie actualizada")
        setIsDialogOpen(false)
        fetchSeries()
      }
    } else {
      const { error } = await supabase.from("series").insert(formData)

      if (error) {
        toast.error("Error al crear serie")
      } else {
        toast.success("Serie creada")
        setIsDialogOpen(false)
        fetchSeries()
      }
    }
  }

  async function deleteSeries(id: string) {
    if (!confirm("¿Estas seguro de eliminar esta serie?")) return

    const { error } = await supabase.from("series").delete().eq("id", id)

    if (error) {
      toast.error("Error al eliminar")
    } else {
      toast.success("Serie eliminada")
      fetchSeries()
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Series</h1>
          <p className="text-muted-foreground">Agrupa documentos en colecciones tematicas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Serie
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSeries ? "Editar Serie" : "Nueva Serie"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Titulo</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Fundamentos de Filosofia"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripcion</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Una serie de analisis sobre..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>URL de portada (opcional)</Label>
                <Input
                  value={formData.cover_url}
                  onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSeries ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : series.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <Layers className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>No hay series creadas</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              {s.cover_url && (
                <div className="aspect-video bg-muted">
                  <img
                    src={s.cover_url}
                    alt={s.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {s.documents?.[0]?.count || 0} documentos
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openDialog(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSeries(s.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {s.description && (
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
