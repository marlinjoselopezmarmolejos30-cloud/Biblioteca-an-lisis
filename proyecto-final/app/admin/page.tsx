import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, MessageSquare, Eye, TrendingUp, Clock } from "lucide-react"

async function getDashboardStats() {
  const supabase = await createClient()

  const [
    { count: documentsCount },
    { count: usersCount },
    { count: commentsCount },
    { data: recentDocs },
    { data: recentComments },
  ] = await Promise.all([
    supabase.from("documents").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase
      .from("documents")
      .select("id, title, views_count, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("comments")
      .select("id, content, created_at, user:profiles(display_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  // Calculate total views
  const { data: viewsData } = await supabase
    .from("documents")
    .select("views_count")

  const totalViews = viewsData?.reduce((sum, doc) => sum + (doc.views_count || 0), 0) || 0

  return {
    documentsCount: documentsCount || 0,
    usersCount: usersCount || 0,
    commentsCount: commentsCount || 0,
    totalViews,
    recentDocs: recentDocs || [],
    recentComments: recentComments || [],
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  const statCards = [
    {
      title: "Documentos",
      value: stats.documentsCount,
      description: "Total publicados",
      icon: FileText,
      color: "text-blue-500",
    },
    {
      title: "Usuarios",
      value: stats.usersCount,
      description: "Registrados",
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Comentarios",
      value: stats.commentsCount,
      description: "Total recibidos",
      icon: MessageSquare,
      color: "text-orange-500",
    },
    {
      title: "Vistas Totales",
      value: stats.totalViews.toLocaleString(),
      description: "En todos los documentos",
      icon: Eye,
      color: "text-purple-500",
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Vista general de la plataforma
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Documentos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay documentos</p>
              ) : (
                stats.recentDocs.map((doc: { id: string; title: string; views_count: number; created_at: string }) => (
                  <div key={doc.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("es")}
                      </p>
                    </div>
                    <div className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {doc.views_count}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentarios Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentComments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay comentarios</p>
              ) : (
                stats.recentComments.map((comment: { id: string; content: string; created_at: string; user: { display_name: string } | null }) => (
                  <div key={comment.id}>
                    <p className="line-clamp-2 text-sm">{comment.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {comment.user?.display_name || "Usuario"} -{" "}
                      {new Date(comment.created_at).toLocaleDateString("es")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
