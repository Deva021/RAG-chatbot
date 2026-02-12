# Admin Seed Instructions

Since we are using **Hosted Supabase** without direct CLI seed access for auth users, we follow this safe process to promote a user to Admin.

## Prerequisites

1.  You have signed up a user in your local app (e.g., `admin@example.com`).
2.  You have access to the Supabase Dashboard > SQL Editor.

## Steps

1.  **Find your User ID**:
    Go to Authentication > Users in the dashboard and copy the `User UID` for `admin@example.com`.

2.  **Run SQL**:
    Open the SQL Editor and run:

    ```sql
    -- Replace 'YOUR_USER_UID_HERE' with the actual UUID
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = 'YOUR_USER_UID_HERE';
    ```

3.  **Verify**:
    Go to the Table Editor > `profiles` table and confirm the `role` is now `admin`.

## Automation (Future)

For a more automated approach in CI/CD, we would use the Supabase Management API to create a user and insert the profile row, but for this "Foundation" batch, manual promotion is the safest and simplest "Code as Truth" approach.
