# Smoke Checklist (Manual Verification)

Run these checks manually on the Hosted Supabase Dashboard after applying migrations.

## 1. Authentication & Profiles

- [ ] **Sign Up**: Create a new user via Supabase Auth UI (or app).
- [ ] **Profile Trigger**: Check `public.profiles`. A new row should exist with `role = 'user'`.
- [ ] **RLS Read**: As that user, run `select * from profiles`. Should return 1 row.

## 2. Knowledge Base (Admin)

- [ ] **Manually Promote**: Update a profile: `update public.profiles set role = 'admin' where id = 'USER_ID';`.
- [ ] **Insert Doc**: As Admin, insert into `kb_documents`. Success.
- [ ] **Insert Chunk**: As Admin, insert into `kb_chunks`. Success.
- [ ] **Read**: As Normal User, select from `kb_documents`. Should see rows (per visibility rule).
- [ ] **Write Fail**: As Normal User, try to insert into `kb_documents`. Should fail.

## 3. Storage

- [ ] **Upload**: As Admin, upload file to `artifacts`. Success.
- [ ] **Public Fail**: Try to access file via public URL. Should receive 400/404/AccessDenied chain.

## 4. Chat

- [ ] **Creation**: User A creates session. User B creates session.
- [ ] **Isolation**: User A `select * from chat_sessions`. Should NOT see User B's session.
