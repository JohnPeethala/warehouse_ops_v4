-- Enable RLS for tables where it's currently disabled
ALTER TABLE public.ops_gt_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_gt_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cfg_settings ENABLE ROW LEVEL SECURITY;

-- Add policies for authenticated users
CREATE POLICY "Enable all for authenticated users" ON public.cfg_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- (Policies for ops_gt_master and ops_gt_roster already exist in the database)
