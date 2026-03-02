
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create user_roles table (roles in separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: check if user is admin or editor
CREATE OR REPLACE FUNCTION public.is_admin_or_editor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'editor')
  )
$$;

-- 5. Profiles RLS
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 6. User roles RLS
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Promotions table
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  title_th TEXT,
  title_en TEXT,
  objective_th TEXT,
  objective_en TEXT,
  suitable_for_th TEXT,
  suitable_for_en TEXT,
  tech_stack_th TEXT,
  tech_stack_en TEXT,
  notes_th TEXT,
  notes_en TEXT,
  price NUMERIC,
  compare_at_price NUMERIC,
  price_unit_th TEXT DEFAULT 'บาท',
  price_unit_en TEXT DEFAULT 'THB',
  badge_text_th TEXT,
  badge_text_en TEXT,
  cover_image_url TEXT,
  gallery_image_urls JSONB DEFAULT '[]'::jsonb,
  alt_text_th TEXT,
  alt_text_en TEXT,
  cta_type TEXT DEFAULT 'link' CHECK (cta_type IN ('link', 'form')),
  cta_label_th TEXT,
  cta_label_en TEXT,
  cta_link TEXT,
  cta_form_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- 9. Promotions RLS

-- Public: only published and within schedule
CREATE POLICY "Public can view published promotions"
  ON public.promotions FOR SELECT
  TO anon
  USING (
    status = 'published'
    AND (start_at IS NULL OR now() >= start_at)
    AND (end_at IS NULL OR now() <= end_at)
  );

-- Admin/editor can view all
CREATE POLICY "Staff can view all promotions"
  ON public.promotions FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

-- Admin/editor can insert
CREATE POLICY "Staff can create promotions"
  ON public.promotions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Admin/editor can update
CREATE POLICY "Staff can update promotions"
  ON public.promotions FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

-- Only admin can delete
CREATE POLICY "Admins can delete promotions"
  ON public.promotions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 10. Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Storage bucket for promotion images
INSERT INTO storage.buckets (id, name, public) VALUES ('promotions', 'promotions', true);

CREATE POLICY "Anyone can view promotion images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'promotions');

CREATE POLICY "Staff can upload promotion images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'promotions' AND public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Staff can update promotion images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'promotions' AND public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete promotion images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'promotions' AND public.has_role(auth.uid(), 'admin'));
