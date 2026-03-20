# CONTEXTO COMPLETO DEL PROYECTO — Biblioteca de Análisis
# Para Claude Code — Lee este archivo completo antes de hacer cualquier cosa

---

## ¿QUIÉN SOY Y QUÉ ESTOY CONSTRUYENDO?

Me llamo Tachiba. Estoy construyendo una **plataforma web tipo biblioteca de análisis interactivos** — similar visualmente a Spotify/YouTube — donde publico documentos HTML de análisis profundos sobre temas complejos (capitalismo, holocausto, zoofilia desde perspectiva académica, etc.).

Soy el único administrador. Los usuarios pueden registrarse, leer, comentar y debatir en tiempo real.

---

## STACK TECNOLÓGICO

- **Frontend:** Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase (PostgreSQL + Realtime + Storage + Auth)
- **Autenticación:** Supabase Auth (email/password + Google OAuth)
- **Deploy:** Vercel
- **Package manager:** pnpm

---

## ESTRUCTURA DEL PROYECTO

```
/app
  /admin           → Panel de administración (protegido por rol)
    /documents     → Listar y gestionar documentos
    /documents/new → Subir nuevo documento HTML
    /categories    → Gestionar categorías
    /series        → Gestionar series
    /comments      → Moderar comentarios
    /users         → Gestionar usuarios
    page.tsx       → Dashboard con estadísticas
    layout.tsx     → Verifica rol admin, muestra sidebar
  /api
    /documents/[id]/view → Registrar vista
    /favorites           → Toggle favorito
    /notifications       → Marcar notificaciones leídas
  /auth
    /login         → Login con email + Google
    /sign-up       → Registro
    /callback      → OAuth callback
  /categories      → Página de todas las categorías
  /category/[slug] → Documentos de una categoría
  /document/[id]   → Visor de documento (iframe) + comentarios
  /favorites       → Documentos favoritos del usuario
  /history         → Historial de lectura
  /profile         → Perfil del usuario
  /search          → Búsqueda de documentos
  /series          → Todas las series
  /series/[id]     → Documentos de una serie
  layout.tsx       → Root layout con ThemeProvider + AuthProvider
  page.tsx         → Página principal (hero + featured + recent + by category)

/components
  /admin
    admin-sidebar.tsx    → Sidebar del panel admin
  /comments
    comments-section.tsx → Lista de comentarios con realtime
    comment-thread.tsx   → Hilo individual con replies
    comment-form.tsx     → Formulario para escribir comentario
  /documents
    document-card.tsx    → Tarjeta de documento (3 variantes: default, featured, compact)
    document-row.tsx     → Fila horizontal de tarjetas con scroll
    document-viewer.tsx  → Visor con iframe + barra progreso + favoritos + compartir
    category-section.tsx → Sección de categoría con sus documentos
    document-sidebar.tsx → Sidebar lateral del documento
  /home
    hero-section.tsx     → Hero de la página principal con búsqueda
  /layout
    header.tsx           → Header global con nav + búsqueda + notificaciones + user menu
  /providers
    auth-provider.tsx    → Context de autenticación global
    theme-provider.tsx   → Modo oscuro/claro
  /ui                    → Componentes shadcn/ui (NO modificar)
  notification-bell.tsx  → Campana de notificaciones con realtime
  series-nav.tsx         → Navegación entre episodios de una serie

  ⚠️ ARCHIVOS DUPLICADOS EN RAÍZ DE /components (versiones antiguas, NO usar):
  - components/document-viewer.tsx    ← OBSOLETO
  - components/document-card.tsx      ← OBSOLETO
  - components/document-row.tsx       ← OBSOLETO
  - components/comments-section.tsx   ← OBSOLETO
  - components/header.tsx             ← OBSOLETO
  - components/hero-section.tsx       ← OBSOLETO

/lib
  /supabase
    client.ts   → createBrowserClient
    server.ts   → createServerClient
  /hooks
    use-documents.ts → Hook para fetching de documentos
  types.ts      → Tipos TypeScript de todas las entidades
  utils.ts      → cn() y helpers

/scripts
  001_create_tables.sql    → Schema completo
  002_create_triggers.sql  → Triggers
  003_seed_data.sql        → Categorías y series iniciales
  004_functions.sql        → Funciones RPC
  006_fixes.sql            → ⚠️ FIXES CRÍTICOS — ejecutar en Supabase primero
```

---

## BASE DE DATOS — SCHEMA REAL

### comments — ⚠️ CAMPO IMPORTANTE
```sql
status TEXT DEFAULT 'visible' CHECK (IN 'visible', 'hidden', 'featured')
-- NO usa is_deleted ni is_highlighted — esos son campos del tipo antiguo
```

### documents — ⚠️ CAMPO RENOMBRADO
```sql
views_count INTEGER  -- En el DB original se llama view_count — ver 006_fixes.sql
comments_count INTEGER DEFAULT 0  -- Agregado en 006_fixes.sql
```

### categories — ⚠️ CAMPO AGREGADO
```sql
order_index INTEGER DEFAULT 0  -- Agregado en 006_fixes.sql
```

---

## ⚠️ BUGS CRÍTICOS — CORREGIR PRIMERO

### Bug 1 — view_count vs views_count
El DB tiene `view_count` pero el frontend usa `views_count`.
**Fix:** Ejecutar `scripts/006_fixes.sql` en Supabase SQL Editor (decírselo a Tachiba).

### Bug 2 — Tipos de comments desincronizados
`lib/types.ts` tenía `is_deleted` e `is_highlighted`. La DB usa `status: 'visible'|'hidden'|'featured'`.
**Fix:** Ya corregido en types.ts — verificar que comment-thread.tsx y comments-section.tsx usen `status`.

### Bug 3 — Imports incorrectos en app/document/[id]/page.tsx
Importaba de `@/components/document-viewer` (obsoleto).
Debe importar de `@/components/documents/document-viewer`.
**Fix:** Ya corregido — verificar.

### Bug 4 — handleSubmit incompleto en admin/documents/new
El archivo original tenía el submit cortado a la mitad.
**Fix:** Ya reescrito completo.

---

## ARCHIVOS QUE FALTAN — CREAR

### 1. `/app/admin/documents/[id]/edit/page.tsx`
Igual a new/ pero pre-populado. Permite editar todos los campos.
Si cambia a 'published' y no tenía published_at, setearlo a now().

### 2. `/app/profile/page.tsx`
Perfil del usuario autenticado. Editar display_name, subir avatar.
Pestañas: Favoritos | Comentarios.

### 3. `/app/history/page.tsx`
Documentos leídos por el usuario, ordenados por last_read_at DESC.
Mostrar progreso. Botón para limpiar historial.

### 4. `/app/favorites/page.tsx`
Grid de DocumentCard de los favoritos del usuario.
Botón para quitar favorito directamente.

### 5. `/app/auth/forgot-password/page.tsx`
Campo email → llama a supabase.auth.resetPasswordForEmail().
Muestra mensaje de éxito.

### 6. `/app/auth/reset-password/page.tsx`
Nueva contraseña + confirmación → supabase.auth.updateUser({ password }).
Redirige a perfil.

### 7. `/middleware.ts`
Middleware de Next.js para refrescar sesión de Supabase en cada request.
Usar patrón oficial de @supabase/ssr.

### 8. `/.env.local.example`
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 9. `/README.md`
Instrucciones completas de setup: instalar deps, configurar Supabase, ejecutar scripts SQL, variables de entorno, deploy en Vercel.

---

## FUNCIONALIDADES PENDIENTES DE COMPLETAR

### Búsqueda funcional
- Barra del header con debounce 300ms → redirige a /search
- Tags clicables en documentos → /search?tag=nombre
- La página /search ya existe

### Publicación programada
- Documentos con status='scheduled' y scheduled_at en el pasado → publicar automáticamente
- Crear Supabase Edge Function con cron cada 5 minutos

### Progreso de lectura
- El iframe reporta scroll → guardar en reading_history si usuario está logueado
- Mostrar en página de historial

### Notificaciones realtime
- NotificationBell suscrita al canal de notificaciones del usuario en Supabase Realtime
- Badge se actualiza sin recargar

---

## CONFIGURACIÓN DE SUPABASE REQUERIDA

### Storage Buckets (crear en Supabase Dashboard):
- `documents` — público — HTML files + cover images
- `avatars` — público — profile pictures
- Estructura: `documents/` para HTML, `covers/` para portadas

### Para dar rol admin al primer usuario:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'tu@email.com';
```

### Variables de entorno en Vercel:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```

---

## DOCUMENTOS HTML DEL CONTENIDO

Los siguientes archivos HTML se subirán a Supabase Storage:
1. `capitalismo-comunismo-v2.html` — categoría: Economía — serie: Sistemas Económicos
2. `ventajas-desventajas.html` — categoría: Economía — serie: Sistemas Económicos
3. `zoofilia-parte1.html` — categoría: Psicología — serie: Análisis Académicos
4. `zoofilia-parte2.html` — categoría: Psicología — serie: Análisis Académicos
5. `holocausto-parte1.html` — categoría: Historia — serie: Historia Contemporánea
6. `holocausto-parte2.html` — categoría: Historia — serie: Historia Contemporánea

Todos tienen navegación interna por secciones (sin scroll continuo entre capítulos).

---

## ORDEN DE TRABAJO RECOMENDADO

1. Leer todos los archivos del proyecto
2. Informar a Tachiba que ejecute `scripts/006_fixes.sql` en Supabase SQL Editor
3. Eliminar archivos obsoletos en raíz de /components
4. Corregir bugs críticos
5. Crear archivos faltantes
6. Crear middleware.ts
7. Verificar: `pnpm tsc --noEmit` sin errores
8. Verificar: `pnpm build` sin errores
9. Crear .env.local.example y README.md

---

## NOTAS IMPORTANTES

- No modificar archivos en `/components/ui/` — son shadcn/ui
- No modificar `pnpm-lock.yaml` manualmente
- El proyecto usa Next.js 16.1.6
- El campo `bio` en profiles puede no existir en el DB — verificar antes de usar
- `ignoreBuildErrors: true` está en next.config.mjs — corregir todos los errores de tipo antes del deploy final
- El diseño visual usa modo oscuro por defecto con el sistema de colores de shadcn/ui

---

*Documento generado desde una sesión de Claude (claude.ai) con Tachiba donde se diseñó y comenzó el proyecto.*
