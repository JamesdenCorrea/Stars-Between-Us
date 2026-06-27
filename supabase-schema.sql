-- ═══════════════════════════════════════════════════════
-- Stars Between Us — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

-- ── Profiles ─────────────────────────────────────────
-- Extends Supabase auth.users with app-specific data
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url   TEXT,
  partner_id   UUID REFERENCES public.profiles(id),
  invite_code  TEXT UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Stargazer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Row Level Security ────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile and their partner's
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR
    auth.uid() = partner_id OR
    partner_id = auth.uid()
  );

-- Users can update only their own profile
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── Connect partners via invite code ─────────────────
CREATE OR REPLACE FUNCTION public.connect_partner(p_invite_code TEXT)
RETURNS json AS $$
DECLARE
  v_partner profiles%ROWTYPE;
  v_me profiles%ROWTYPE;
BEGIN
  -- Find the partner
  SELECT * INTO v_partner FROM profiles
  WHERE invite_code = upper(p_invite_code);

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invalid invite code');
  END IF;

  -- Can't connect to yourself
  IF v_partner.id = auth.uid() THEN
    RETURN json_build_object('error', 'That''s your own code!');
  END IF;

  -- Check if already connected
  IF v_partner.partner_id IS NOT NULL THEN
    RETURN json_build_object('error', 'This person is already connected to someone');
  END IF;

  -- Link both profiles
  UPDATE profiles SET partner_id = v_partner.id WHERE id = auth.uid();
  UPDATE profiles SET partner_id = auth.uid() WHERE id = v_partner.id;

  RETURN json_build_object('success', true, 'partner_name', v_partner.display_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
