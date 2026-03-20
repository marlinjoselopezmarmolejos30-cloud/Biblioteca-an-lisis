"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { Document, Category } from "@/lib/types"

const supabase = createClient()

// Fetcher for documents with category
async function fetchDocuments(key: string) {
  const params = new URLSearchParams(key.split("?")[1] || "")
  const category = params.get("category")
  const featured = params.get("featured")
  const limit = params.get("limit")
  const search = params.get("search")

  let query = supabase
    .from("documents")
    .select(`
      *,
      category:categories(*)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })

  if (category) {
    query = query.eq("category_id", category)
  }

  if (featured === "true") {
    query = query.eq("is_featured", true)
  }

  if (limit) {
    query = query.limit(parseInt(limit))
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data as (Document & { category: Category | null })[]
}

// Fetch single document
async function fetchDocument(id: string) {
  const { data, error } = await supabase
    .from("documents")
    .select(`
      *,
      category:categories(*),
      series:series(*)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data as Document & { category: Category | null }
}

// Fetch categories
async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("order_index")

  if (error) throw error
  return data as Category[]
}

// Hook for documents list
export function useDocuments(options?: {
  category?: string
  featured?: boolean
  limit?: number
  search?: string
}) {
  const params = new URLSearchParams()
  if (options?.category) params.set("category", options.category)
  if (options?.featured) params.set("featured", "true")
  if (options?.limit) params.set("limit", options.limit.toString())
  if (options?.search) params.set("search", options.search)

  const key = `documents?${params.toString()}`

  return useSWR(key, fetchDocuments, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })
}

// Hook for single document
export function useDocument(id: string | null) {
  return useSWR(id ? `document-${id}` : null, () => fetchDocument(id!), {
    revalidateOnFocus: false,
  })
}

// Hook for categories
export function useCategories() {
  return useSWR("categories", fetchCategories, {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
  })
}

// Hook for documents by category (grouped)
export function useDocumentsByCategory() {
  const { data: categories, error: catError } = useCategories()
  const { data: documents, error: docError } = useDocuments()

  const grouped = categories?.map((category) => ({
    category,
    documents: documents?.filter((doc) => doc.category_id === category.id) || [],
  }))

  return {
    data: grouped,
    isLoading: !categories || !documents,
    error: catError || docError,
  }
}

// Real-time subscription for new documents
export function subscribeToDocuments(callback: (doc: Document) => void) {
  const channel = supabase
    .channel("documents-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "documents",
        filter: "status=eq.published",
      },
      (payload) => {
        callback(payload.new as Document)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
