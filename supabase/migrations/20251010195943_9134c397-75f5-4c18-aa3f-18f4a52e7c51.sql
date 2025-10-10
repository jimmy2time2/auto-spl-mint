-- Fix security definer view by enabling security invoker
ALTER VIEW public.governor_status_updates SET (security_invoker = on);