-- ============================================================================
-- 607 חולצות — Full schema migration for a brand-new Supabase project
-- Paste this whole file into Supabase SQL Editor and run it once.
-- Idempotent: safe to re-run if something fails partway through.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Core tables (base + everything added later via ad-hoc SQL in the original site)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  short_description TEXT,
  full_description TEXT,
  images TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  out_of_stock_sizes TEXT[] DEFAULT '{}',
  out_of_stock_colors TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{all}',
  collection_id UUID,
  display_order INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  clothing_category TEXT,
  faqs JSONB DEFAULT '[]',
  size_chart_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  open_date TIMESTAMPTZ NOT NULL,
  close_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','closed','production','shipped')),
  estimated_delivery TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  progress_steps JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  delivery_method TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'received' CHECK (status IN ('received','pending_payment','paid','production','packing','shipped','delivered')),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  collection_id UUID,
  user_id UUID,
  paid_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  type TEXT DEFAULT 'general' CHECK (type IN ('family_message','collection_request','general')),
  message TEXT NOT NULL,
  subscribe BOOLEAN DEFAULT FALSE,
  requested_collections TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'percent' CHECK (type IN ('percent','fixed')),
  value DECIMAL(10,2) NOT NULL,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS popups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  text TEXT,
  image TEXT,
  button_text TEXT,
  button_link TEXT,
  bg_color TEXT DEFAULT '#FFFFFF',
  text_color TEXT DEFAULT '#1A1A1A',
  is_active BOOLEAN DEFAULT TRUE,
  pages TEXT[] DEFAULT '{all}',
  trigger TEXT DEFAULT 'immediate' CHECK (trigger IN ('immediate','delayed','exit')),
  trigger_delay INTEGER DEFAULT 3,
  priority INTEGER DEFAULT 0,
  popup_settings JSONB DEFAULT '{}',
  overlay_settings JSONB DEFAULT '{}',
  blocks JSONB DEFAULT '[]',
  display_rules JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Neutral starter content (not the Nehoray Leizer memorial copy) — edit freely from /admin/content
INSERT INTO site_content (key, value) VALUES
  ('hero_title', '607 חולצות'),
  ('hero_subtitle', 'קולקציה חדשה — בקרוב'),
  ('hero_cta', 'לצפייה בקולקציה'),
  ('brand_tagline', '607 חולצות'),
  ('brand_description', 'עדכן/י את הטקסט הזה מפאנל הניהול תחת "עריכת תוכן".'),
  ('footer_instagram', '#'),
  ('footer_whatsapp', ''),
  ('whatsapp_message', 'שלום, אני מעוניין/ת במוצרים')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Size charts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS size_charts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  internal_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit TEXT DEFAULT 'cm' CHECK (unit IN ('cm','in')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published')),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS size_chart_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  size_chart_id UUID REFERENCES size_charts(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'products_size_chart_id_fkey'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_size_chart_id_fkey
      FOREIGN KEY (size_chart_id) REFERENCES size_charts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Community quotes (public story-page feature)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS community_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Order status timeline
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_order_status_history() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_status_history (order_id, status) VALUES (NEW.id, NEW.status);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_status_history_insert_trigger ON orders;
CREATE TRIGGER order_status_history_insert_trigger
AFTER INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION log_order_status_history();

-- ---------------------------------------------------------------------------
-- Analytics / activity / tasks
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view','product_view','add_to_cart','checkout_start')),
  product_id UUID,
  path TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor TEXT DEFAULT 'admin',
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Separate, older activity log used specifically by /admin/activity — distinct
-- table from activity_log above (both exist independently in the original site).
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Stickers / flags + custom print submissions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sticker_flag_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  preview_image TEXT,
  type TEXT CHECK (type IN ('sticker','flag','both')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_print_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  width_cm NUMERIC,
  height_cm NUMERIC,
  print_type TEXT NOT NULL CHECK (print_type IN ('sticker','flag','both')),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Customer accounts (Supabase Auth), pickup numbers, admin notes on customers
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  address TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_pickup_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_key TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  pickup_number SERIAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_profiles (
  phone TEXT PRIMARY KEY,
  admin_notes TEXT,
  admin_tags TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Waitlist / notify-me
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS popup_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  popup_id UUID,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  page_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, email)
);

-- ---------------------------------------------------------------------------
-- Manual payment verification
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payment_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT,
  payment_method TEXT,
  received_amount NUMERIC,
  note TEXT,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_chart_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticker_flag_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_print_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_pickup_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE popup_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_checks ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "Public read products" ON products;
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read collections" ON collections;
CREATE POLICY "Public read collections" ON collections FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Public read site_content" ON site_content;
CREATE POLICY "Public read site_content" ON site_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read active popups" ON popups;
CREATE POLICY "Public read active popups" ON popups FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Public read published size_charts" ON size_charts;
CREATE POLICY "Public read published size_charts" ON size_charts FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Public read community_quotes" ON community_quotes;
CREATE POLICY "Public read community_quotes" ON community_quotes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read active sticker_flag_files" ON sticker_flag_files;
CREATE POLICY "Public read active sticker_flag_files" ON sticker_flag_files FOR SELECT USING (is_active = true);

-- Public insert (anonymous visitor writes)
DROP POLICY IF EXISTS "Public insert orders" ON orders;
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public insert messages" ON messages;
CREATE POLICY "Public insert messages" ON messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public insert community_quotes" ON community_quotes;
CREATE POLICY "Public insert community_quotes" ON community_quotes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public insert popup_submissions" ON popup_submissions;
CREATE POLICY "Public insert popup_submissions" ON popup_submissions FOR INSERT WITH CHECK (true);

-- Self-service user_profiles (Supabase Auth accounts manage their own row)
DROP POLICY IF EXISTS "Users read own profile" ON user_profiles;
CREATE POLICY "Users read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users upsert own profile" ON user_profiles;
CREATE POLICY "Users insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Service role — full access on everything
DROP POLICY IF EXISTS "Service role all" ON products;
CREATE POLICY "Service role all" ON products FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role collections all" ON collections;
CREATE POLICY "Service role collections all" ON collections FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role orders all" ON orders;
CREATE POLICY "Service role orders all" ON orders FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role messages all" ON messages;
CREATE POLICY "Service role messages all" ON messages FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role discounts all" ON discount_codes;
CREATE POLICY "Service role discounts all" ON discount_codes FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role popups all" ON popups;
CREATE POLICY "Service role popups all" ON popups FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role content all" ON site_content;
CREATE POLICY "Service role content all" ON site_content FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role size_charts all" ON size_charts;
CREATE POLICY "Service role size_charts all" ON size_charts FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role size_chart_versions all" ON size_chart_versions;
CREATE POLICY "Service role size_chart_versions all" ON size_chart_versions FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role community_quotes all" ON community_quotes;
CREATE POLICY "Service role community_quotes all" ON community_quotes FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role order_status_history all" ON order_status_history;
CREATE POLICY "Service role order_status_history all" ON order_status_history FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role analytics_events all" ON analytics_events;
CREATE POLICY "Service role analytics_events all" ON analytics_events FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role activity_log all" ON activity_log;
CREATE POLICY "Service role activity_log all" ON activity_log FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role admin_activity_log all" ON admin_activity_log;
CREATE POLICY "Service role admin_activity_log all" ON admin_activity_log FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role admin_tasks all" ON admin_tasks;
CREATE POLICY "Service role admin_tasks all" ON admin_tasks FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role sticker_flag_files all" ON sticker_flag_files;
CREATE POLICY "Service role sticker_flag_files all" ON sticker_flag_files FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role custom_print_submissions all" ON custom_print_submissions;
CREATE POLICY "Service role custom_print_submissions all" ON custom_print_submissions FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role user_profiles all" ON user_profiles;
CREATE POLICY "Service role user_profiles all" ON user_profiles FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role customer_pickup_numbers all" ON customer_pickup_numbers;
CREATE POLICY "Service role customer_pickup_numbers all" ON customer_pickup_numbers FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role customer_profiles all" ON customer_profiles;
CREATE POLICY "Service role customer_profiles all" ON customer_profiles FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role popup_submissions all" ON popup_submissions;
CREATE POLICY "Service role popup_submissions all" ON popup_submissions FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role product_notifications all" ON product_notifications;
CREATE POLICY "Service role product_notifications all" ON product_notifications FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role payment_checks all" ON payment_checks;
CREATE POLICY "Service role payment_checks all" ON payment_checks FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Storage buckets (public-read; service role bypasses RLS for writes)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('products', 'products', true),
  ('collections', 'collections', true),
  ('story', 'story', true),
  ('branding', 'branding', true),
  ('stickers-flags', 'stickers-flags', true)
ON CONFLICT (id) DO NOTHING;
