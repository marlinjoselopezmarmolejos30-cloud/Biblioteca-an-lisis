import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { document_id } = await request.json()

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("document_id", document_id)
    .single()

  if (existing) {
    // Remove favorite
    await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id)
    
    return NextResponse.json({ favorited: false })
  } else {
    // Add favorite
    await supabase
      .from("favorites")
      .insert({ user_id: user.id, document_id })
    
    return NextResponse.json({ favorited: true })
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const document_id = searchParams.get("document_id")

  if (document_id) {
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("document_id", document_id)
      .single()
    
    return NextResponse.json({ favorited: !!data })
  }

  const { data } = await supabase
    .from("favorites")
    .select("document_id")
    .eq("user_id", user.id)

  return NextResponse.json({ favorites: data?.map(f => f.document_id) || [] })
}
