"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Upload, Loader2, FileText, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import type { Category, Series } from "@/lib/types"

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export default function NewDocumentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    series_id: "",
    series_order: "",
    tags: "",
    status: "draft",
    is_featured: false,
    scheduled_at: "",
    estimated_read_time: "10",
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [{ data: cats }, { data: ser }] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("series").select("*").order("title"),
    ])
    setCategories(cats || [])
    setSeries(ser || [])
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title) {
      toast.error("El titulo es obligatorio")
      return
    }
    if (!htmlFile) {
      toast.error("El archivo HTML es obligatorio")
      return
    }

    setLoading(true)

    try {
      let content_url = ""
      let cover_url = null

      // Upload HTML file to Supabase Storage
      const htmlPath = `documents/${Date.now()}_${htmlFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
      const { error: htmlError } = await supabase.storage
        .from("documents")
        .upload(htmlPath, htmlFile, { contentType: "text/html" })
      
      if (htmlError) throw htmlError

      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(htmlPath)
      content_url = publicUrl

      // Upload cover image
      if (coverFile) {
        const coverPath = `covers/${Date.now()}_${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const { error: coverError } = await supabase.storage
          .from("documents")
          .upload(coverPath, coverFile)
        if (!coverError) {
          const { data: { publicUrl: coverPublicUrl } } = supabase.storage
            .from("documents")
            .getPublicUrl(coverPath)
          cover_url = coverPublicUrl
        }
      }

      // Generate unique slug
      const baseSlug = slugify(formData.title)
      const slug = `${baseSlug}-${Date.now()}`

      // Insert document
      const docData: Record<string, unknown> = {
        title: formData.title,
        slug,
        description: formData.description || null,
        content_url,
        cover_url,
        category_id: formData.category_id || null,
        series_id: formData.series_id || null,
        series_order: formData.series_order ? parseInt(formData.series_order) : null,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        status: formData.status,
        is_featured: formData.is_featured,
        estimated_read_time: formData.estimated_read_time ? parseInt(formData.estimated_read_time) : 10,
      }

      if (formData.status === "published") {
        docData.published_at = new Date().toISOString()
      }
      if (formData.status === "scheduled" && formData.scheduled_at) {
        docData.scheduled_at = new Date(formData.scheduled_at).toISOString()
      }

      const { data: newDoc, error: insertError } = await supabase
        .from("documents")
        .insert(docData)
        .select()
        .single()

      if (insertError) throw insertError

      toast.success("Documento creado correctamente")
      router.push("/admin/documents")
    } catch (error: unknown) {
      console.error("Error creating document:", error)
      toast.error(error instanceof Error ? error.message : "Error al crear el documento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Nuevo Documento</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información del documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título del documento"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descripción del contenido (máx. 300 caracteres)"
                  maxLength={300}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{formData.description.length}/300</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="read-time">Tiempo de lectura (min)</Label>
                  <Input
                    id="read-time"
                    type="number"
                    min="1"
                    max="180"
                    value={formData.estimated_read_time}
                    onChange={(e) => setFormData({ ...formData, estimated_read_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Serie (opcional)</Label>
                  <Select
                    value={formData.series_id}
                    onValueChange={(v) => setFormData({ ...formData, series_id: v === "none" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin serie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin serie</SelectItem>
                      {series.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.series_id && (
                  <div className="space-y-2">
                    <Label htmlFor="series-order">Orden en la serie</Label>
                    <Input
                      id="series-order"
                      type="number"
                      min="1"
                      value={formData.series_order}
                      onChange={(e) => setFormData({ ...formData, series_order: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas (separadas por coma)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="filosofia, historia, analisis"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Archivos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Archivo HTML *</Label>
                <div
                  className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary"
                  onClick={() => document.getElementById("html-input")?.click()}
                >
                  <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                  {htmlFile ? (
                    <p className="text-sm font-medium text-primary">{htmlFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Haz clic para subir un archivo HTML</p>
                      <p className="text-xs text-muted-foreground mt-1">Solo archivos .html o .htm</p>
                    </>
                  )}
                  <input
                    id="html-input"
                    type="file"
                    accept=".html,.htm"
                    className="hidden"
                    onChange={(e) => setHtmlFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Imagen de portada</Label>
                <div
                  className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary"
                  onClick={() => document.getElementById("cover-input")?.click()}
                >
                  {coverPreview ? (
                    <img src={coverPreview} alt="Preview" className="h-32 w-full rounded-md object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Haz clic para subir una imagen</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP hasta 5MB</p>
                    </>
                  )}
                  <input
                    id="cover-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="published">Publicado ahora</SelectItem>
                    <SelectItem value="scheduled">Programar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === "scheduled" && (
                <div className="space-y-2">
                  <Label>Fecha y hora de publicación</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label htmlFor="featured" className="cursor-pointer font-medium">Destacar</Label>
                  <p className="text-xs text-muted-foreground">Aparece en la sección principal</p>
                </div>
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(c) => setFormData({ ...formData, is_featured: c })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Crear Documento
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
