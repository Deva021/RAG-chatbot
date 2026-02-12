# Docs: Migration Workflow

Since we use **Hosted Supabase** without local CLI connectivity, migrations are applied manually via the Supabase Dashboard.

## 1. Source of Truth

The `supabase/migrations/` folder is the source of truth.

- Files are named `YYYYMMDDHHMMSS_description.sql`.
- **NEVER** modify schema in the Supabase Dashboard UI manually. Always write SQL first.

## 2. Applying Migrations

1.  Go to [Supabase Dashboard](https://supabase.com/dashboard).
2.  Navigate to **SQL Editor**.
3.  Open a new query.
4.  Copy the content of the `.sql` file from `supabase/migrations/`.
5.  Run the query.
6.  Verify in **Table Editor** or **Database** settings.

## 3. Idempotency

All migrations are written with `IF NOT EXISTS` guards.
Re-running a migration should be safe and result in no changes (idempotent).

## 4. Current Migrations

- `20260212000000_enable_pgvector.sql`
- `20260212000001_create_profiles.sql`
- `20260212000002_create_kb_schema.sql`
- `20260212000003_create_chat_schema.sql`
- `20260212000004_rls_profiles.sql`
- `20260212000005_rls_kb.sql`
- `20260212000006_rls_chat.sql`
- `20260212000007_storage_buckets.sql`
