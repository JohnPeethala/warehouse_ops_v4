CREATE POLICY "Enable all access for authenticated users" ON public.ops_ticket_annotations FOR ALL TO authenticated USING (true) WITH CHECK (true);  
CREATE POLICY "Enable all access for authenticated users" ON public.cfg_geo_zones FOR ALL TO authenticated USING (true) WITH CHECK (true);  
CREATE POLICY "Enable all access for authenticated users" ON public.ops_staged_tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);  
CREATE POLICY "Enable all access for authenticated users" ON public.ops_gt_master FOR ALL TO authenticated USING (true) WITH CHECK (true);  
CREATE POLICY "Enable all access for authenticated users" ON public.ops_gt_roster FOR ALL TO authenticated USING (true) WITH CHECK (true); 
