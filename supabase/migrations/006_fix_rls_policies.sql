-- Fix RLS: add user_id column, tighten admin/customer access, avoid recursion

-- 1. Add user_id to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);

-- 2. SECURITY DEFINER helper to check admin status WITHOUT triggering RLS recursion.
--    A policy on `orders` that selects from `admin_users` would otherwise re-trigger
--    the `admin_users` policies, causing "infinite recursion detected in policy".
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE id = uid)
$$;

-- 3. admin_users SELECT: only admins may read the list (uses non-recursive is_admin).
--    INSERT/DELETE are intentionally NOT granted to authenticated — the
--    create-user / delete-user API routes use the service role key, which
--    bypasses RLS. This blocks customers from tampering with the admin list.
DROP POLICY IF EXISTS "Allow admins to read admin list" ON admin_users;
DROP POLICY IF EXISTS "Allow admins to add admins" ON admin_users;
DROP POLICY IF EXISTS "Allow admins to remove admins" ON admin_users;

CREATE POLICY "Allow admins to read admin list"
  ON admin_users FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

-- 4. orders SELECT: admins see all, customers see only their own.
--    Customer email comes from the JWT (auth.jwt()->>'email'); querying
--    auth.users directly is denied to the authenticated role.
DROP POLICY IF EXISTS "Allow admins to read orders" ON orders;
DROP POLICY IF EXISTS "Allow admins to read all orders" ON orders;
DROP POLICY IF EXISTS "Allow customers to read own orders" ON orders;

CREATE POLICY "Allow admins to read all orders"
  ON orders FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Allow customers to read own orders"
  ON orders FOR SELECT TO authenticated
  USING (
    customer_email = (auth.jwt() ->> 'email')
    OR user_id = auth.uid()
  );

-- 5. orders UPDATE/DELETE: admins only
DROP POLICY IF EXISTS "Allow admins to update orders" ON orders;
DROP POLICY IF EXISTS "Allow admins to delete orders" ON orders;

CREATE POLICY "Allow admins to update orders"
  ON orders FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Allow admins to delete orders"
  ON orders FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

-- Note: the public INSERT policy on orders ("Allow public order submission")
-- from migration 002 is unchanged — anon + authenticated can still submit orders.

-- 6. Harden the is_admin helper: only authenticated needs it (for RLS policies).
--    Revoke broad EXECUTE so it can't be called via /rest/v1/rpc by anon/public.
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
