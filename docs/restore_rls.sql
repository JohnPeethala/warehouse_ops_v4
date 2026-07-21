-- Restore Row Level Security

-- First, ensure RLS is enabled
ALTER TABLE public.ops_ticket_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_dispatch_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_route_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_profiles ENABLE ROW LEVEL SECURITY;

-- Drop the permissive policies that bypassed security
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ops_ticket_annotations;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.ops_ticket_annotations;
DROP POLICY IF EXISTS "Enable update for all users" ON public.ops_ticket_annotations;

DROP POLICY IF EXISTS "authenticated users can access ops_ticket_annotations" ON public.ops_ticket_annotations;
DROP POLICY IF EXISTS "authenticated users can access ops_dispatch_log" ON public.ops_dispatch_log;
DROP POLICY IF EXISTS "authenticated users can access ops_route_sessions" ON public.ops_route_sessions;
DROP POLICY IF EXISTS "authenticated users can access core_profiles" ON public.core_profiles;

-- Recreate strict policies checking auth.uid()
CREATE POLICY "authenticated users can access ops_ticket_annotations" ON public.ops_ticket_annotations 
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated users can access ops_dispatch_log" ON public.ops_dispatch_log 
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated users can access ops_route_sessions" ON public.ops_route_sessions 
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated users can access core_profiles" ON public.core_profiles 
FOR ALL USING (auth.uid() IS NOT NULL);
