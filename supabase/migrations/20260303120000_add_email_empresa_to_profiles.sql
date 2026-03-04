-- Add email_empresa field to profiles for business email display
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_empresa TEXT;
