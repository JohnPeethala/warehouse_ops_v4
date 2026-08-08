-- 1. Enable RLS on required tables
ALTER TABLE public.ops_route_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop roster tables
DROP TABLE IF EXISTS public.ops_gt_roster CASCADE;
DROP TABLE IF EXISTS public.ops_gt_master CASCADE;

-- 3. Drop unused views/tables
DROP VIEW IF EXISTS public.latest_dispatch_logs CASCADE;
DROP TABLE IF EXISTS public.latest_dispatch_logs CASCADE;

DROP VIEW IF EXISTS public.daily_route_summary CASCADE;
DROP TABLE IF EXISTS public.daily_route_summary CASCADE;

DROP VIEW IF EXISTS public.daily_schedule_snapshot CASCADE;
DROP TABLE IF EXISTS public.daily_schedule_snapshot CASCADE;
