"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BackButton() {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.back()}
      className="mt-6 text-muted-foreground"
    >
      <ArrowLeft className="mr-1 h-4 w-4" />
      Volver atrás
    </Button>
  )
}
