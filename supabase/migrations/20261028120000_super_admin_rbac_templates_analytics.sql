BEGIN;

-- 1. User Profiles with Role-Based Access
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS Policies for Profiles
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins view all" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND (role = 'user' OR public.is_admin()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 2. Dynamic Templates Table (Managed ONLY by Admin)
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY, -- Must match component key in src/templates/registry.ts (e.g., 'royal-kerala-gold')
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Traditional', 'Minimal', 'Modern', 'Floral', 'Luxury')),
  price_inr INTEGER NOT NULL DEFAULT 1499,
  thumbnail_url TEXT NOT NULL,
  demo_slug TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  default_theme_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active templates" ON public.templates;
CREATE POLICY "Public can view active templates" ON public.templates
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can insert templates" ON public.templates;
CREATE POLICY "Only admins can insert templates" ON public.templates
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can update templates" ON public.templates;
CREATE POLICY "Only admins can update templates" ON public.templates
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can delete templates" ON public.templates;
CREATE POLICY "Only admins can delete templates" ON public.templates
  FOR DELETE USING (public.is_admin());

-- 3. Add Admin Override & View Counter to Weddings Table
ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS published_by_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Allow Admins full CRUD and free publish override on ALL weddings
DROP POLICY IF EXISTS "Admins have full access to all weddings" ON public.weddings;
CREATE POLICY "Admins have full access to all weddings" ON public.weddings
  FOR ALL USING (public.is_admin());

-- 4. Analytics Page Views & Conversion Events Table
CREATE TABLE IF NOT EXISTS public.page_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES public.weddings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'map_click', 'calendar_click', 'rsvp_submit')),
  device_type TEXT, -- 'mobile' | 'desktop'
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;

-- Anyone can log a view/click; Couples see their own site analytics; Admins see all platform analytics
DROP POLICY IF EXISTS "Anyone can insert page events" ON public.page_events;
CREATE POLICY "Anyone can insert page events" ON public.page_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users and Admins can view page events" ON public.page_events;
CREATE POLICY "Users and Admins can view page events" ON public.page_events
  FOR SELECT USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = page_events.wedding_id AND w.user_id = auth.uid())
  );

-- Seed pre-built registered templates into the templates table
INSERT INTO public.templates (id, name, category, price_inr, thumbnail_url, is_active)
VALUES
  ('royal-rajwada', 'Royal Rajwada', 'Luxury', 1499, '/thumbs/royal.webp', true),
  ('minimal-sage', 'Minimal Sage', 'Minimal', 1499, '/thumbs/sage.webp', true),
  ('boho-floral', 'Boho Floral', 'Floral', 1499, '/thumbs/boho.webp', true),
  ('nikah-emerald', 'Nikah Emerald (Kerala Royale)', 'Traditional', 1499, '/thumbs/emerald.webp', true),
  ('bento-clay', 'Bento Clay (Terracotta)', 'Modern', 1499, '/thumbs/bento-clay.webp', true),
  ('malabar-royal-gold', 'Malabar Royal Gold', 'Luxury', 1499, '/thumbs/malabar-gold.webp', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price_inr = EXCLUDED.price_inr,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_active = EXCLUDED.is_active;

-- Grant required permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

GRANT SELECT ON public.templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;

GRANT SELECT, INSERT ON public.page_events TO anon, authenticated;
GRANT ALL ON public.page_events TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT (published_by_admin, views_count) ON public.weddings TO authenticated, anon;
GRANT ALL ON public.weddings TO service_role;

COMMIT;
