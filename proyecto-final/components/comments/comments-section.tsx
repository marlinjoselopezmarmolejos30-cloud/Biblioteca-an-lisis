"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { CommentForm } from "./comment-form"
import { CommentThread } from "./comment-thread"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { MessageCircle } from "lucide-react"
import type { Profile } from "@/lib/types"

interface CommentsSectionProps {
  documentId: string
}

export interface CommentWithProfile {
  id: string
  document_id: string
  user_id: string
  parent_id: string | null
  content: string
  likes_count: number
  status: 'visible' | 'hidden' | 'featured'
  created_at: string
  updated_at: string
  user: Profile
  replies: CommentWithProfile[]
  has_liked: boolean
}

export function CommentsSection({ documentId }: CommentsSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<CommentWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent")

  const supabase = createClient()

  const fetchComments = async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from("comments")
      .select(`*, user:profiles(*)`)
      .eq("document_id", documentId)
      .neq("status", "hidden")
      .is("parent_id", null)
      .order(sortBy === "recent" ? "created_at" : "likes_count", { ascending: false })

    if (error) {
      console.error("Error fetching comments:", error)
      setIsLoading(false)
      return
    }

    const commentsWithReplies = await Promise.all(
      (data || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from("comments")
          .select(`*, user:profiles(*)`)
          .eq("parent_id", comment.id)
          .neq("status", "hidden")
          .order("created_at", { ascending: true })

        let hasLiked = false
        if (user) {
          const { data: like } = await supabase
            .from("comment_likes")
            .select("id")
            .eq("comment_id", comment.id)
            .eq("user_id", user.id)
            .single()
          hasLiked = !!like
        }

        const repliesWithLikes = await Promise.all(
          (replies || []).map(async (reply) => {
            let replyHasLiked = false
            if (user) {
              const { data: like } = await supabase
                .from("comment_likes")
                .select("id")
                .eq("comment_id", reply.id)
                .eq("user_id", user.id)
                .single()
              replyHasLiked = !!like
            }
            return { ...reply, has_liked: replyHasLiked, replies: [] }
          })
        )

        return { ...comment, has_liked: hasLiked, replies: repliesWithLikes }
      })
    )

    setComments(commentsWithReplies as CommentWithProfile[])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchComments()
  }, [documentId, sortBy])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${documentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `document_id=eq.${documentId}`,
        },
        () => { fetchComments() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [documentId])

  const featuredComments = comments.filter((c) => c.status === "featured")
  const regularComments = comments.filter((c) => c.status !== "featured")

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <MessageCircle className="h-5 w-5" />
          Comentarios ({comments.length})
        </h3>
        <div className="flex gap-1">
          <Button
            variant={sortBy === "recent" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("recent")}
          >
            Recientes
          </Button>
          <Button
            variant={sortBy === "popular" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("popular")}
          >
            Populares
          </Button>
        </div>
      </div>

      {user ? (
        <CommentForm documentId={documentId} onCommentAdded={fetchComments} />
      ) : (
        <div className="mb-6 rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <a href="/auth/login" className="text-primary hover:underline">
              Inicia sesion
            </a>{" "}
            para dejar un comentario
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-6 w-6" />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>Se el primero en comentar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {featuredComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              documentId={documentId}
              onUpdate={fetchComments}
              isFeatured
            />
          ))}
          {regularComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              documentId={documentId}
              onUpdate={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  )
}
