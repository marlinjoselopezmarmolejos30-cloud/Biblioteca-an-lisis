"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { CommentForm } from "./comment-form"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { 
  Heart, MessageCircle, MoreHorizontal, Star, Trash2, VolumeX, Flag
} from "lucide-react"
import type { CommentWithProfile } from "./comments-section"
import { cn } from "@/lib/utils"

interface CommentThreadProps {
  comment: CommentWithProfile
  documentId: string
  onUpdate: () => void
  isFeatured?: boolean
  isReply?: boolean
}

export function CommentThread({
  comment,
  documentId,
  onUpdate,
  isFeatured = false,
  isReply = false,
}: CommentThreadProps) {
  const { user, isAdmin } = useAuth()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isLiking, setIsLiking] = useState(false)

  const supabase = createClient()

  const handleLike = async () => {
    if (!user) {
      toast.error("Inicia sesion para dar like")
      return
    }
    setIsLiking(true)
    if (comment.has_liked) {
      await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", comment.id)
        .eq("user_id", user.id)
    } else {
      await supabase.from("comment_likes").insert({
        comment_id: comment.id,
        user_id: user.id,
      })
    }
    setIsLiking(false)
    onUpdate()
  }

  const handleFeature = async () => {
    const newStatus = comment.status === "featured" ? "visible" : "featured"
    await supabase
      .from("comments")
      .update({ status: newStatus })
      .eq("id", comment.id)
    toast.success(newStatus === "featured" ? "Comentario destacado" : "Comentario no destacado")
    onUpdate()
  }

  const handleDelete = async () => {
    await supabase
      .from("comments")
      .update({ status: "hidden" })
      .eq("id", comment.id)
    toast.success("Comentario eliminado")
    onUpdate()
  }

  const handleMuteUser = async () => {
    await supabase
      .from("profiles")
      .update({ is_silenced: true })
      .eq("id", comment.user_id)
    toast.success("Usuario silenciado")
  }

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: es,
  })

  return (
    <div
      className={cn(
        "rounded-lg",
        isFeatured && "border-2 border-primary/30 bg-primary/5",
        isReply && "ml-8 mt-3"
      )}
    >
      <div className={cn("p-3", isFeatured && "relative")}>
        {isFeatured && (
          <div className="absolute -top-2 left-4 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            <Star className="h-3 w-3" />
            Destacado
          </div>
        )}

        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={comment.user?.avatar_url || undefined} />
            <AvatarFallback>
              {comment.user?.display_name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {comment.user?.display_name || "Usuario"}
              </span>
              {comment.user?.role === "admin" && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">Admin</span>
              )}
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>

            <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>

            <div className="mt-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-7 gap-1 px-2 text-xs", comment.has_liked && "text-red-500")}
                onClick={handleLike}
                disabled={isLiking}
              >
                <Heart className={cn("h-3.5 w-3.5", comment.has_liked && "fill-current")} />
                {comment.likes_count > 0 && comment.likes_count}
              </Button>

              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Responder
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={handleFeature}>
                        <Star className="mr-2 h-4 w-4" />
                        {comment.status === "featured" ? "Quitar destacado" : "Destacar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleMuteUser}>
                        <VolumeX className="mr-2 h-4 w-4" />
                        Silenciar usuario
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isAdmin && (
                    <DropdownMenuItem>
                      <Flag className="mr-2 h-4 w-4" />
                      Reportar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {showReplyForm && (
          <div className="mt-3 ml-11">
            <CommentForm
              documentId={documentId}
              parentId={comment.id}
              onCommentAdded={() => {
                setShowReplyForm(false)
                onUpdate()
              }}
              onCancel={() => setShowReplyForm(false)}
              placeholder="Escribe tu respuesta..."
              autoFocus
            />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply) => (
              <CommentThread
                key={reply.id}
                comment={reply}
                documentId={documentId}
                onUpdate={onUpdate}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
