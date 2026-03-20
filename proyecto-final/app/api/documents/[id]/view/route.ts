import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Increment view count
  await supabase.rpc("increment_views", { doc_id: id })

  // If user is logged in, update reading history
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const body = await request.json().catch(() => ({}))
    const progress = body.progress || 0

    await supabase
      .from("reading_history")
      .upsert({
        user_id: user.id,
        document_id: id,
        progress,
        last_read_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,document_id",
      })
  }

  return NextResponse.json({ success: true })
}
