"use client"

import Link from "next/link"
import { DocumentRow } from "./document-row"
import type { Document, Category } from "@/lib/types"

interface CategorySectionProps {
  category: Category
  documents: (Document & { category?: Category | null })[]
}

export function CategorySection({ category, documents }: CategorySectionProps) {
  if (documents.length === 0) return null

  return (
    <DocumentRow
      title={category.name}
      documents={documents}
      href={`/category/${category.slug}`}
    />
  )
}
