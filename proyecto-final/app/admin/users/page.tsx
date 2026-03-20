"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { Search, MoreHorizontal, Shield, ShieldOff, Ban, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import type { Profile } from "@/lib/types"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Error al cargar usuarios")
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  async function updateRole(id: string, role: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id)

    if (error) {
      toast.error("Error al actualizar rol")
    } else {
      toast.success("Rol actualizado")
      fetchUsers()
    }
  }

  async function toggleBan(id: string, currentlyBanned: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: !currentlyBanned })
      .eq("id", id)

    if (error) {
      toast.error("Error al actualizar estado")
    } else {
      toast.success(currentlyBanned ? "Usuario desbaneado" : "Usuario baneado")
      fetchUsers()
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground">Gestiona los usuarios de la plataforma</p>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No hay usuarios
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {user.display_name?.slice(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.display_name || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? "Admin" : "Usuario"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_banned ? (
                        <Badge variant="destructive">Baneado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Activo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString("es")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.role !== "admin" ? (
                            <DropdownMenuItem onClick={() => updateRole(user.id, "admin")}>
                              <Shield className="mr-2 h-4 w-4" />
                              Hacer Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => updateRole(user.id, "user")}>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Quitar Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => toggleBan(user.id, user.is_banned || false)}>
                            {user.is_banned ? (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Desbanear
                              </>
                            ) : (
                              <>
                                <Ban className="mr-2 h-4 w-4" />
                                Banear
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
