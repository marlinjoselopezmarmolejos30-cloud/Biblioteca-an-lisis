// Database types for the platform

export type UserRole = 'admin' | 'user' | 'visitor'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  bio?: string | null
  role: UserRole
  is_silenced: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  color: string
  description: string | null
  order_index?: number
  created_at: string
}

export interface Series {
  id: string
  title: string
  slug: string
  description: string | null
  cover_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  title: string
  slug: string
  description: string | null
  content_url: string
  cover_url: string | null
  category_id: string | null
  series_id: string | null
  series_order: number | null
  tags: string[]
  status: 'draft' | 'published' | 'scheduled'
  is_featured: boolean
  views_count: number
  comments_count: number
  estimated_read_time: number | null
  published_at: string | null
  scheduled_at: string | null
  created_at: string
  updated_at: string
  // Relations
  category?: Category | null
  series?: Series | null
}

export interface Comment {
  id: string
  document_id: string
  user_id: string
  parent_id: string | null
  content: string
  likes_count: number
  // DB uses status field: 'visible' | 'hidden' | 'featured'
  status: 'visible' | 'hidden' | 'featured'
  created_at: string
  updated_at: string
  // Relations
  user?: Profile
  replies?: Comment[]
  has_liked?: boolean
}

export interface Notification {
  id: string
  user_id: string
  type: 'new_document' | 'comment_reply' | 'comment_like' | 'system'
  title: string
  message: string | null
  document_id: string | null
  is_read: boolean
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  document_id: string
  created_at: string
  document?: Document
}

export interface ReadingHistory {
  id: string
  user_id: string
  document_id: string
  progress: number
  last_read_at: string
  document?: Document
}

// API response types
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DocumentWithRelations extends Document {
  category: Category | null
  series: Series | null
}
