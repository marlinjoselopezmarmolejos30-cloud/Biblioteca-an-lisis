# BRIEF COMPLETO PARA IA — Biblioteca de Análisis
# Lee este archivo COMPLETO antes de tocar cualquier cosa.

---

## QUIÉN SOY Y QUÉ ES ESTE PROYECTO

Me llamo **Tachiba**. Estoy construyendo una **plataforma web tipo biblioteca de análisis interactivos** — visualmente similar a Spotify/YouTube — donde publico documentos HTML de análisis profundos sobre temas complejos (capitalismo, historia, psicología académica, etc.).

- Soy el **único administrador**.
- Los usuarios pueden registrarse, leer, comentar y debatir en tiempo real.
- El contenido son archivos HTML que se suben a Supabase Storage y se visualizan en un iframe.

---

## STACK TECNOLÓGICO

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui |
| Backend / DB | Supabase (PostgreSQL + Realtime + Storage + Auth) |
| Autenticación | Supabase Auth (email/password + Google OAuth) |
| Deploy | Vercel |
| Package manager | pnpm |

---

## LO QUE YA EXISTE (estado actual)

### Estructura de rutas creadas

```
/app
  page.tsx                      ✅ Página principal (hero + featured + recent + por categoría)
  /admin
    page.tsx                    ✅ Dashboard con estadísticas
    layout.tsx                  ✅ Verifica rol admin, muestra sidebar
    /documents/page.tsx         ✅ Listar y gestionar documentos
    /documents/new/page.tsx     ✅ Subir nuevo documento HTML
    /categories/page.tsx        ✅ Gestionar categorías
    /series/page.tsx            ✅ Gestionar series
  /api
    /documents/[id]/view/route.ts  ✅ Registrar vista de documento
    /favorites/route.ts            ✅ Toggle favorito
    /notifications/route.ts        ✅ Marcar notificaciones leídas
  /auth
    /login/page.tsx             ✅ Login con email + Google OAuth
    /auth/callback/route.ts     ✅ OAuth callback de Supabase
    /sign-up-success/page.tsx   ✅ Página de confirmación de email
  /document/[id]/page.tsx       ✅ Visor de documento (iframe) + comentarios
  /search/page.tsx              ✅ Búsqueda de documentos
  /profile/page.tsx             ✅ Perfil del usuario autenticado
```

### Componentes creados

```
/components
  /admin
    admin-sidebar.tsx           ✅ Sidebar del panel de administración
  /comments
    comments-section.tsx        ✅ Lista de comentarios con realtime
    comment-thread.tsx          ✅ Hilo individual con replies
  /documents
    document-card.tsx           ✅ Tarjeta de documento (3 variantes)
    document-row.tsx            ✅ Fila horizontal con scroll
    document-viewer.tsx         ✅ Visor con iframe + barra de progreso
    category-section.tsx        ✅ Sección de categoría con sus documentos
    document-sidebar.tsx        ✅ Sidebar lateral del documento
  /home
    hero-section.tsx            ✅ Hero de la página principal con búsqueda
  /layout
    header.tsx                  ✅ Header global con nav + búsqueda + notificaciones
  /providers
    auth-provider.tsx           ✅ Context global de autenticación
    theme-provider.tsx          ✅ Modo oscuro/claro
  notification-bell.tsx         ✅ Campana con badge en tiempo real
  series-nav.tsx                ✅ Navegación entre episodios de una serie
  search-command.tsx            ✅ Paleta de búsqueda rápida (Cmd+K)
  theme-toggle.tsx              ✅ Botón para cambiar tema
```

### Lib / utilidades

```
/lib
  /supabase
    client.ts                   ✅ createBrowserClient (uso en cliente)
    server.ts                   ✅ createServerClient (uso en servidor/API)
  /hooks
    use-documents.ts            ✅ Hook para fetching de documentos
  types.ts                      ✅ Tipos TypeScript de todas las entidades
  utils.ts                      ✅ cn() y helpers
```

### Base de datos (Supabase)

Tablas existentes y sus campos importantes:

```sql
profiles        → id, email, display_name, avatar_url, role, is_silenced
categories      → id, name, slug, color, description, order_index
series          → id, title, slug, description, cover_url, sort_order
documents       → id, title, slug, description, content_url, cover_url,
                  category_id, series_id, series_order, tags, status,
                  is_featured, views_count, comments_count,
                  estimated_read_time, scheduled_at, published_at
comments        → id, document_id, user_id, parent_id, content,
                  likes_count, status ('visible'|'hidden'|'featured')
comment_likes   → id, comment_id, user_id
favorites       → id, document_id, user_id
reading_history → id, document_id, user_id, progress, last_read_at
notifications   → id, user_id, type, title, message, document_id, is_read
document_views  → id, document_id, user_id, ip_address, device_type,
                  read_time_seconds
```

Funciones RPC disponibles:
- `increment_views(doc_id UUID)` — incrementa views_count de un documento
- `toggle_comment_like(comment_id, user_id)` — devuelve boolean

Scripts SQL aplicados:
- `001_create_tables.sql` — todas las tablas + RLS
- `002_create_triggers.sql` — triggers automáticos
- `004_functions.sql` — funciones RPC
- `006_fixes.sql` — renombra view_count→views_count, agrega comments_count y order_index
- `SCHEMA_COMPLETO.sql` — archivo combinado, listo para ejecutar desde cero

---

## LO QUE FALTA CREAR

### Archivos ausentes (alta prioridad)

#### 1. `/middleware.ts` — CRÍTICO
Middleware de Next.js para refrescar sesión de Supabase en cada request.
Usar el patrón oficial de `@supabase/ssr`.
Sin esto, la autenticación falla en rutas protegidas al refrescar la página.

```typescript
// Patrón esperado:
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // refrescar sesión + pasar cookies actualizadas
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

#### 2. `/app/admin/documents/[id]/edit/page.tsx`
Igual a `/app/admin/documents/new/page.tsx` pero pre-populado con los datos del documento.
- Carga el documento por ID
- Todos los campos editables
- Si cambia status a `'published'` y `published_at` era null → setearlo a `now()`

#### 3. `/app/admin/comments/page.tsx`
Tabla con todos los comentarios de todos los documentos.
- Columnas: usuario, documento, contenido, fecha, estado
- Acciones: ocultar (status → 'hidden'), destacar (status → 'featured'), eliminar
- Filtros por status

#### 4. `/app/admin/users/page.tsx`
Tabla de todos los usuarios registrados.
- Columnas: avatar, nombre, email, rol, silenciado, fecha registro
- Acciones: cambiar rol, silenciar/dessilenciar

#### 5. `/app/history/page.tsx`
Historial de lectura del usuario autenticado.
- Query: `reading_history` con join a `documents` → order by `last_read_at DESC`
- Mostrar barra de progreso por documento
- Botón "Limpiar historial" (DELETE all para ese user_id)

#### 6. `/app/favorites/page.tsx`
Grid de DocumentCard con los documentos favoritos del usuario.
- Query: `favorites` con join a `documents + categories`
- Botón para quitar favorito directamente desde la card

#### 7. `/app/auth/forgot-password/page.tsx`
- Campo email → llama a `supabase.auth.resetPasswordForEmail(email, { redirectTo: ... })`
- Muestra mensaje de éxito: "Revisa tu correo"

#### 8. `/app/auth/reset-password/page.tsx`
- Campo nueva contraseña + confirmación
- Llama a `supabase.auth.updateUser({ password })`
- Redirige a `/profile` tras éxito

#### 9. `/.env.local.example`
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Funcionalidades incompletas

#### Búsqueda funcional
- La barra del header debe buscar con debounce de 300ms
- Redirigir a `/search?q=termino`
- Tags clicables en documentos → `/search?tag=nombre`
- La página `/search` ya existe pero puede necesitar conectar los params

#### Publicación programada
- Documentos con `status='scheduled'` y `scheduled_at` en el pasado deben publicarse solos
- Crear una **Supabase Edge Function** con cron cada 5 minutos:
  ```sql
  UPDATE documents SET status='published', published_at=now()
  WHERE status='scheduled' AND scheduled_at <= now()
  ```

#### Progreso de lectura en tiempo real
- El iframe del visor envía eventos de scroll → guardar `progress` en `reading_history`
- Solo si el usuario está autenticado
- Usar `postMessage` o calcular scroll % del iframe

#### Notificaciones realtime
- `NotificationBell` debe suscribirse al canal de Supabase Realtime:
  ```typescript
  supabase.channel('notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}` }, handler)
    .subscribe()
  ```

---

## ARCHIVOS OBSOLETOS (ELIMINAR)

Estos archivos en la raíz de `/components` son versiones antiguas. Usar los que están en subcarpetas.

```
components/document-viewer.tsx    ← ELIMINAR (usar /documents/document-viewer.tsx)
components/document-card.tsx      ← ELIMINAR (usar /documents/document-card.tsx)
components/document-row.tsx       ← ELIMINAR (usar /documents/document-row.tsx)
components/comments-section.tsx   ← ELIMINAR (usar /comments/comments-section.tsx)
components/header.tsx             ← ELIMINAR (usar /layout/header.tsx)
components/hero-section.tsx       ← ELIMINAR (usar /home/hero-section.tsx)
```

---

## REGLAS Y RESTRICCIONES IMPORTANTES

1. **No modificar** nada dentro de `/components/ui/` — son componentes de shadcn/ui
2. **No modificar** `pnpm-lock.yaml` manualmente
3. El campo `bio` en profiles puede NO existir en la DB — verificar antes de usar
4. `next.config.mjs` tiene `ignoreBuildErrors: true` — corregir todos los errores TypeScript antes del deploy final
5. El campo de comentarios usa `status: 'visible'|'hidden'|'featured'` — NO `is_deleted` ni `is_highlighted`
6. El campo de vistas en documentos es `views_count` (ya renombrado) — NO `view_count`
7. Los imports deben venir de las subcarpetas correctas, no de la raíz de `/components`

---

## CONFIGURACIÓN DE SUPABASE (para el dueño del proyecto)

### Storage Buckets a crear en Supabase Dashboard:
- `documents` — acceso público — para archivos HTML y portadas
- `avatars` — acceso público — para fotos de perfil

### Dar rol admin al primer usuario:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'tu@email.com';
```

### Variables de entorno necesarias (en Vercel y en `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
```

---

## ORDEN DE TRABAJO RECOMENDADO

1. Leer TODOS los archivos del proyecto antes de modificar nada
2. Eliminar los 6 archivos obsoletos en la raíz de `/components`
3. Crear `middleware.ts` (sin esto la auth falla)
4. Crear los archivos faltantes en el orden: history → favorites → forgot-password → reset-password → admin/comments → admin/users → admin/documents/[id]/edit
5. Conectar la búsqueda del header
6. Verificar TypeScript: `pnpm tsc --noEmit` sin errores
7. Verificar build: `pnpm build` sin errores
8. Crear `.env.local.example`

---

## OBJETIVO FINAL

Una plataforma funcional donde:
- Cualquier visitante puede explorar y leer los documentos
- Los usuarios registrados pueden comentar, dar likes, guardar favoritos y ver su historial
- El administrador (Tachiba) puede subir documentos HTML, crear categorías y series, moderar comentarios y gestionar usuarios desde un panel completo
- El sistema envía notificaciones en tiempo real cuando hay nuevos documentos o respuestas

---

*Generado el 2026-03-21. Proyecto: Biblioteca de Análisis (Next.js + Supabase).*
