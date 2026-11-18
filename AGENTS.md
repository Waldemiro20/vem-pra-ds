# Regras do projeto

Next.js 16 (App Router) + Prisma 7 + Supabase (Postgres do próprio usuário), com deploy na Vercel.
O projeto não é mais gerenciado pelo Lovable.

- All app data (landing registrations, super admin accounts and admin sessions) lives only in the user's own Supabase Postgres, accessed through Prisma (`prisma/schema.prisma`, client in `src/lib/db.server.ts`) from Server Actions (`src/app/actions.ts`) or route handlers that revalidate every input with zod. No Google Sheets, no storage buckets, no JSON files, and no personal data or credentials in the code or migrations. Admins are created with `npm run admin:criar`.
- Modules under `src/lib/*.server.ts` import `server-only`; never import them from client components.
- `DATABASE_URL` is the only credential: `.env.local` locally (never `.env`, which is committed) and Vercel Environment Variables in production. Keep RLS enabled on every `sam_*` table, store only password and session-token hashes, and log classified failures, never personal data, raw database errors or credentials.
- Schema changes: edit `prisma/schema.prisma`, create a migration with `prisma migrate dev`, apply with `npm run db:migrar`. `supabase/` and `drizzle/` are leftovers from Lovable and are not used.
