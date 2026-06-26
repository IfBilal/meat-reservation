-- Add user_id to orders so logged-in customers can track their own orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
