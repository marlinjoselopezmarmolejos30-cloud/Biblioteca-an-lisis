# Biblioteca de Análisis

Plataforma web tipo biblioteca de análisis interactivos — similar visualmente a Spotify/YouTube — donde se publican documentos HTML de análisis profundos sobre temas complejos.

## Stack

- **Frontend:** Next.js 16 App Router + TypeScript + Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase (PostgreSQL + Realtime + Storage + Auth)
- **Autenticación:** Supabase Auth (email/password + Google OAuth)
- **Deploy:** Vercel
- **Package manager:** pnpm

## Setup

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd proyecto-final
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Variables de entorno

Copia el archivo de ejemplo y rellena tus credenciales de Supabase:

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Configurar Supabase

#### Ejecutar scripts SQL (en este orden en el SQL Editor de Supabase):

1. `scripts/001_create_tables.sql` — Schema completo
2. `scripts/002_create_triggers.sql` — Triggers
3. `scripts/002_profile_trigger.sql` — Trigger de perfil
4. `scripts/003_seed_data.sql` — Categorías y series iniciales
5. `scripts/004_functions.sql` — Funciones RPC
6. `scripts/005_seed_sample_data.sql` — Datos de ejemplo (opcional)
7. `scripts/006_fixes.sql` — ⚠️ CRÍTICO — ejecutar siempre

#### Crear Storage Buckets (en Supabase Dashboard > Storage):

- `documents` — público — para archivos HTML y portadas
- `avatars` — público — para fotos de perfil

#### Dar rol admin al primer usuario:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'tu@email.com';
```

### 5. Ejecutar en desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Deploy en Vercel

1. Importar el repositorio en Vercel
2. Configurar las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (tu dominio de producción)
3. Deploy

## Estructura principal

```
/app          → Páginas (App Router)
/components   → Componentes React
/lib          → Supabase clients, tipos, utils
/scripts      → Scripts SQL para la base de datos
/public       → Assets estáticos
```
