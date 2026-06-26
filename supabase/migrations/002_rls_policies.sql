-- Enable RLS
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ORDERS: public can insert, only admins can read/update/delete
CREATE POLICY "Allow public order submission"
  ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow admins to read orders"
  ON orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to update orders"
  ON orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow admins to delete orders"
  ON orders FOR DELETE TO authenticated USING (true);

-- ADMIN_USERS: only authenticated can read/insert/delete
CREATE POLICY "Allow admins to read admin list"
  ON admin_users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to add admins"
  ON admin_users FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow admins to remove admins"
  ON admin_users FOR DELETE TO authenticated USING (true);
