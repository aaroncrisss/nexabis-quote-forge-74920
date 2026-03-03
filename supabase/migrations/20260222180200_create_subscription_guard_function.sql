-- =====================================================
-- MIGRATION: Create subscription guard RPC function
-- Validates whether a user can create presupuestos
-- based on their subscription tier and monthly usage
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_create_presupuesto(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_record RECORD;
  count_this_month int;
BEGIN
  -- Fetch subscription info
  SELECT subscription_tier, subscription_status, trial_ends_at, max_presupuestos_mes
  INTO profile_record
  FROM public.profiles
  WHERE id = user_uuid;

  -- No profile found
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'no_profile');
  END IF;

  -- Suspended users cannot create anything
  IF profile_record.subscription_status = 'suspended' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'subscription_suspended');
  END IF;

  -- Cancelled users cannot create anything
  IF profile_record.subscription_status = 'cancelled' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'subscription_cancelled');
  END IF;

  -- Trial expired check
  IF profile_record.subscription_status = 'trial'
     AND profile_record.trial_ends_at IS NOT NULL
     AND profile_record.trial_ends_at < now() THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'trial_expired');
  END IF;

  -- Premium/Enterprise users: unlimited access
  IF profile_record.subscription_tier IN ('premium', 'enterprise')
     AND profile_record.subscription_status IN ('active', 'trial', 'pending_cancellation') THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'premium');
  END IF;

  -- Free tier: check monthly limit
  SELECT COUNT(*) INTO count_this_month
  FROM public.presupuestos
  WHERE usuario_id = user_uuid
    AND date_trunc('month', created_at) = date_trunc('month', now());

  IF count_this_month >= profile_record.max_presupuestos_mes THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'monthly_limit_reached',
      'current', count_this_month,
      'limit', profile_record.max_presupuestos_mes
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'within_limits',
    'remaining', profile_record.max_presupuestos_mes - count_this_month,
    'current', count_this_month,
    'limit', profile_record.max_presupuestos_mes
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.can_create_presupuesto(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_create_presupuesto(uuid) TO anon;
