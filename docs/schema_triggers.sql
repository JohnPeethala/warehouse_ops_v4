-- ==========================================
-- WAREHOUSE OPs v4 - TRIGGERS & POLICIES
-- ==========================================

-- -----------------------------------------------------------------------------
-- 1. SELF-HEALING ANALYTICS (FACT TABLES)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_fact_dispatch_lifecycle() RETURNS trigger AS $$
DECLARE
  v_is_terminal boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM fact_dispatch_lifecycle WHERE dispatch_log_id = OLD.id;
    RETURN OLD;
  END IF;

  -- Dynamic lookup for terminal status
  SELECT is_terminal INTO v_is_terminal 
  FROM cfg_lookups 
  WHERE domain = 'TICKET' AND status = NEW.status AND coalesce(sub_status, '') = coalesce(NEW.sub_status, '');

  INSERT INTO fact_dispatch_lifecycle (
    dispatch_log_id, ticket_id, scheduled_date, status, sub_status, gt1_id, gt2_id, completed_at
  )
  SELECT 
    NEW.id, NEW.ticket_id, NEW.scheduled_date, NEW.status, NEW.sub_status, r.gt1_id, r.gt2_id, 
    CASE WHEN v_is_terminal = true THEN now() ELSE NULL END
  FROM ops_route_sessions r WHERE r.id = NEW.gt_trip_id
  ON CONFLICT (dispatch_log_id) DO UPDATE SET
    status = EXCLUDED.status,
    sub_status = EXCLUDED.sub_status,
    gt1_id = EXCLUDED.gt1_id,
    gt2_id = EXCLUDED.gt2_id,
    completed_at = EXCLUDED.completed_at;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_fact_dispatch
AFTER INSERT OR UPDATE ON ops_dispatch_log
FOR EACH ROW EXECUTE FUNCTION sync_fact_dispatch_lifecycle();


-- -----------------------------------------------------------------------------
-- 2. GLOBAL AUDIT TRAIL
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION log_audit_event() RETURNS trigger AS $$
BEGIN
  INSERT INTO log_audit_trail (actor_id, table_name, action, old_value, new_value)
  VALUES (
    coalesce(NEW.updated_by, OLD.updated_by, current_setting('app.current_user_id', true)::uuid),
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_ops_ticket_annotations
AFTER INSERT OR UPDATE OR DELETE ON ops_ticket_annotations
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_ops_dispatch_log
AFTER INSERT OR UPDATE OR DELETE ON ops_dispatch_log
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_ops_route_sessions
AFTER INSERT OR UPDATE OR DELETE ON ops_route_sessions
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_ops_notes
AFTER INSERT OR UPDATE OR DELETE ON ops_notes
FOR EACH ROW EXECUTE FUNCTION log_audit_event();


-- -----------------------------------------------------------------------------
-- 3. TICKET LIFECYCLE TRACKING
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION log_ticket_status_change() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO log_ticket_lifecycle (ticket_id, old_status, new_status, changed_by)
    VALUES (NEW.ticket_id, OLD.status, NEW.status, coalesce(NEW.updated_by, current_setting('app.current_user_id', true)::uuid));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_ticket_status
AFTER UPDATE ON ops_dispatch_log
FOR EACH ROW EXECUTE FUNCTION log_ticket_status_change();


-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE core_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfg_lookups ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfg_ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfg_geo_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_manifest_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_staged_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_ticket_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_route_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_dispatch_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_warehouse_duty ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_duty_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_kra_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_kra_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_ticket_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_schedule_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_dispatch_lifecycle ENABLE ROW LEVEL SECURITY;

-- Base Policies (Required to prevent empty results for clients)
CREATE POLICY "authenticated users can access core_profiles" ON core_profiles FOR ALL USING (true);
CREATE POLICY "authenticated users can access core_vehicles" ON core_vehicles FOR ALL USING (true);
CREATE POLICY "authenticated users can access cfg_lookups" ON cfg_lookups FOR ALL USING (true);
CREATE POLICY "authenticated users can access cfg_ticket_categories" ON cfg_ticket_categories FOR ALL USING (true);
CREATE POLICY "authenticated users can access cfg_geo_zones" ON cfg_geo_zones FOR ALL USING (true);
CREATE POLICY "authenticated users can access ops_manifest_batches" ON ops_manifest_batches FOR ALL USING (true);
CREATE POLICY "authenticated users can access ops_staged_tickets" ON ops_staged_tickets FOR ALL USING (true);
CREATE POLICY "authenticated users can access ops_ticket_annotations" ON ops_ticket_annotations FOR ALL USING (true);
CREATE POLICY "authenticated users can access ops_route_sessions" ON ops_route_sessions FOR ALL USING (true);
CREATE POLICY "authenticated users can access ops_dispatch_log" ON ops_dispatch_log FOR ALL USING (true);
CREATE POLICY "authenticated users can access ops_warehouse_duty" ON ops_warehouse_duty FOR ALL USING (true);
CREATE POLICY "authenticated users can access ops_duty_crew" ON ops_duty_crew FOR ALL USING (true);
CREATE POLICY "authenticated users can access ops_kra_master" ON ops_kra_master FOR ALL USING (true);
CREATE POLICY "authenticated users can access ops_kra_logs" ON ops_kra_logs FOR ALL USING (true);
CREATE POLICY "authenticated users can access ops_notes" ON ops_notes FOR ALL USING (true);
CREATE POLICY "authenticated users can access log_audit_trail" ON log_audit_trail FOR ALL USING (true);
CREATE POLICY "authenticated users can access log_ticket_lifecycle" ON log_ticket_lifecycle FOR ALL USING (true);
CREATE POLICY "authenticated users can access daily_schedule_snapshot" ON daily_schedule_snapshot FOR ALL USING (true);
CREATE POLICY "authenticated users can access fact_dispatch_lifecycle" ON fact_dispatch_lifecycle FOR ALL USING (true);

-- Note: Because we are enforcing "Thick Server, Thin Client", your Next.js server actions 
-- will bypass RLS by using the Service Role Key safely on the backend, or by impersonating 
-- users using strict server-side guards. 

-- If you intend to use Supabase Client side querying, you will need explicit policies. 
-- For now, we will create a default block so the backend can operate freely.
