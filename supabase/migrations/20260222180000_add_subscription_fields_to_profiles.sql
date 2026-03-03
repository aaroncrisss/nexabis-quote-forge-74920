-- =====================================================
-- MIGRATION: Add subscription fields to profiles
-- Enables SaaS model with trial/free/premium tiers
-- =====================================================

-- Add subscription columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_external_id text,
  ADD COLUMN IF NOT EXISTS subscription_provider text,
  ADD COLUMN IF NOT EXISTS rubro text DEFAULT 'tecnologia',
  ADD COLUMN IF NOT EXISTS max_presupuestos_mes int DEFAULT 5;

-- Migrate existing users to premium active (grandfather them in)
UPDATE public.profiles
SET subscription_tier = 'premium',
    subscription_status = 'active',
    trial_ends_at = NULL
WHERE subscription_status = 'trial';

-- Add check constraints for valid values
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_subscription_tier
    CHECK (subscription_tier IN ('free', 'premium', 'enterprise'));

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_subscription_status
    CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled', 'pending_cancellation'));

-- Index for subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- Update handle_new_user to check whitelist and set subscription accordingly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_whitelisted boolean;
BEGIN
  -- Check if the email is in the whitelist
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_permitidos
    WHERE email = NEW.email AND activo = TRUE
  ) INTO is_whitelisted;

  IF is_whitelisted THEN
    -- Whitelisted users get premium active immediately
    INSERT INTO public.profiles (id, nombre, email, subscription_tier, subscription_status, trial_ends_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
      NEW.email,
      'premium',
      'active',
      NULL
    );
  ELSE
    -- Regular users get free trial (14 days)
    INSERT INTO public.profiles (id, nombre, email, subscription_tier, subscription_status, trial_ends_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
      NEW.email,
      'free',
      'trial',
      now() + interval '14 days'
    );
  END IF;

  RETURN NEW;
END;
$$;
