"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Send } from "lucide-react"

interface CommentFormProps {
  documentId: string
  parentId?: string
  onCommentAdded: () => void
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export function CommentForm({
  documentId,
  parentId,
  onCommentAdded,
  onCancel,
  placeholder = "Escribe tu comentario...",
  autoFocus = false,
}: CommentFormProps) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !content.trim()) return

    if (profile?.is_muted) {
      toast.error("Tu cuenta esta silenciada y no puedes comentar")
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.from("comments").insert({
      document_id: documentId,
      user_id: user.id,
      parent_id: parentId || null,
      content: content.trim(),
    })

    setIsSubmitting(false)

    if (error) {
      toast.error("Error al publicar el comentario")
      return
    }

    setContent("")
    onCommentAdded()
    toast.success("Comentario publicado")
  }

  if (!user) return null

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback>
            {profile?.display_name?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[80px] resize-none"
            autoFocus={autoFocus}
          />
          <div className="mt-2 flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isSubmitting}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
