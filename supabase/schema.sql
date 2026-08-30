-- LAZER Brand - Supabase Schema
-- Run this in your Supabase SQL editor

-- Products
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  short_description TEXT,
  full_description TEXT,
  images TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{all}',
  collection_id UUID,
  display_order INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  open_date TIMESTAMPTZ NOT NULL,
  close_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','closed','production','shipped')),
  estimated_delivery TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'received' CHECK (status IN ('received','pending_payment','paid','production','packing','shipped','delivered')),
  notes TEXT,
  collection_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (contact form)
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  type TEXT DEFAULT 'general' CHECK (type IN ('family_message','collection_request','general')),
  message TEXT NOT NULL,
  subscribe BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount codes
CREATE TABLE discount_codes (
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

-- Popups
CREATE TABLE popups (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site content (editable via admin)
CREATE TABLE site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default site content
INSERT INTO site_content (key, value) VALUES
  ('hero_title', 'לבוש את הסיפור'),
  ('hero_subtitle', 'קולקציה 01 — עכשיו פתוחה להזמנות'),
  ('hero_cta', 'Shop Collection'),
  ('brand_tagline', 'מותג שנולד מאהבה, לזכרו של נהוראי ליזר'),
  ('brand_description', 'כל פריט שתבחר הוא חלק מסיפור. מותג שנוסד על ידי המשפחה והחברים, כדי לשמור את הרוח חיה — בבגדים, בצבעים, בעיצוב.'),
  ('footer_instagram', '#'),
  ('footer_whatsapp', '0503313034'),
  ('whatsapp_message', 'שלום, אני מעוניין/ת במוצרי LAZER'),
  ('impact_text', 'כל רכישה תומכת ישירות במשפחה ובהנצחת הזיכרון');

-- Storage bucket for product images (run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('collections', 'collections', true);

-- RLS Policies (allow public read, service role write)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read collections" ON collections FOR SELECT USING (is_active = true);
CREATE POLICY "Public read site_content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Public read active popups" ON popups FOR SELECT USING (is_active = true);
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role all" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role collections all" ON collections FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role orders all" ON orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role messages all" ON messages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role discounts all" ON discount_codes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role popups all" ON popups FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role content all" ON site_content FOR ALL USING (auth.role() = 'service_role');
