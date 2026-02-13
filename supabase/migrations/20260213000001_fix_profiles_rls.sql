-- Migration Fix: Resolve Recursive RLS on Profiles
-- Date: 2026-02-13

-- 1. Remove the problematic recursive policy safely
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 2. Ensure the basic "view own profile" policy is clean and active
-- Using DROP/CREATE for maximum traceability and idempotency
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 3. Policy for updating own profile (restored for completeness)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 4. (Optional) Safer Admin global view policy (non-recursive)
-- Only add this if you strictly need admins to list other users in the UI.
-- For now, we leave it out to ensure the login gate works 100%.
