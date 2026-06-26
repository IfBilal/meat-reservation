-- Create status enum
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'ready', 'picked_up');

-- Create orders table
CREATE TABLE orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name  TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  pickup_date    DATE NOT NULL,
  tire_lbs       NUMERIC(6,2) NOT NULL DEFAULT 0,
  kitfo_lbs      NUMERIC(6,2) NOT NULL DEFAULT 0,
  tibs_lbs       NUMERIC(6,2) NOT NULL DEFAULT 0,
  godin_lbs      NUMERIC(6,2) NOT NULL DEFAULT 0,
  gubet_lbs      NUMERIC(6,2) NOT NULL DEFAULT 0,
  kidney_lbs     NUMERIC(6,2) NOT NULL DEFAULT 0,
  notes          TEXT,
  status         order_status NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_customer_name  ON orders (customer_name);
CREATE INDEX idx_orders_customer_phone ON orders (customer_phone);
CREATE INDEX idx_orders_pickup_date    ON orders (pickup_date);
CREATE INDEX idx_orders_status         ON orders (status);

-- Admin users table (linked to Supabase Auth)
CREATE TABLE admin_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
