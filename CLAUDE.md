# Ahadu Fresh Meat Reservation — Claude Instructions

## Supabase Migration Rule (CRITICAL)

Every single Supabase operation — creating tables, modifying columns, adding indexes, writing RLS policies, creating functions, enabling realtime, seeding data — **must** be reflected immediately in a migration SQL file inside the `supabase/migrations/` folder.

### Why
The project is currently developed on the developer's personal Supabase project. When the project is handed over to the client, they will create a fresh Supabase project and run these migration files in the SQL editor to replicate the exact same database setup. If a migration file is missing or outdated, the client's project will be broken.

### Rules
- Every time a SQL query is run in Supabase (via dashboard or otherwise), the exact same SQL must be saved to `supabase/migrations/`
- Migration files are named in order: `001_initial_schema.sql`, `002_rls_policies.sql`, `003_add_column_xyz.sql`, etc.
- Migration files are **append-only** — never edit an old migration file. If something changes, create a new migration file.
- Migration files must always be **up to date** with the actual Supabase project state
- If a table is altered, a column added, a policy changed, or a function updated — a new migration file is created immediately, not later

### Folder Structure
```
supabase/
  migrations/
    001_initial_schema.sql
    002_rls_policies.sql
    003_seed_admin.sql
    ... (new file for every change)
```

### What goes in migrations
- `CREATE TABLE` statements
- `ALTER TABLE` statements
- `CREATE INDEX` statements
- RLS `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` statements
- `CREATE OR REPLACE FUNCTION` statements (PostgreSQL functions only)
- `ALTER PUBLICATION` (realtime)
- Any seed data (e.g. first admin insert)

## Supabase Edge Functions

Edge Functions are **not SQL** — they are Deno TypeScript and do NOT go in migration files. They live in `supabase/functions/<function-name>/index.ts` and are deployed via the Supabase CLI.

```
supabase/
  migrations/   ← SQL only
  functions/    ← Deno TypeScript Edge Functions
    send-confirmation-email/
      index.ts
```

When handing over to the client:
- Migration files → copy-paste into their Supabase SQL editor
- Edge Functions → deploy via `supabase functions deploy` to their project
