CREATE OR REPLACE FUNCTION resolve_ticket_status()
RETURNS TRIGGER AS $$
DECLARE
  resolved_status TEXT;
BEGIN
  -- Only run if the sub-status has changed (or on insert)
  IF (TG_OP = 'INSERT' OR NEW.sub_status IS DISTINCT FROM OLD.sub_status) THEN
    
    -- Find the parent status from the lookup table
    SELECT status INTO resolved_status
    FROM cfg_lookups
    WHERE domain = 'TICKET' AND sub_status = NEW.sub_status
    LIMIT 1;

    -- If found, apply it to the row before it saves
    IF resolved_status IS NOT NULL THEN
      NEW.status := resolved_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resolve_ticket_status ON ops_dispatch_log;
CREATE TRIGGER trigger_resolve_ticket_status
BEFORE INSERT OR UPDATE ON ops_dispatch_log
FOR EACH ROW
EXECUTE FUNCTION resolve_ticket_status();

CREATE OR REPLACE FUNCTION recalculate_session_counters(session_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE ops_route_sessions
  SET 
    total = (SELECT COUNT(*) FROM ops_dispatch_log WHERE gt_trip_id = session_id),
    done = (SELECT COUNT(*) FROM ops_dispatch_log WHERE gt_trip_id = session_id AND status IN ('Done', 'Completed', 'Delivered')),
    not_done = (SELECT COUNT(*) FROM ops_dispatch_log WHERE gt_trip_id = session_id AND status IN ('Failed', 'Cancelled', 'Not Done', 'Rejected')),
    pending = (SELECT COUNT(*) FROM ops_dispatch_log WHERE gt_trip_id = session_id AND (status IS NULL OR status IN ('Pending', 'In Progress', 'Assigned')))
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_ops_route_session_counters()
RETURNS TRIGGER AS $$
DECLARE
  target_session_id UUID;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    target_session_id := OLD.gt_trip_id;
  ELSE
    target_session_id := NEW.gt_trip_id;
  END IF;

  IF (TG_OP = 'UPDATE' AND OLD.gt_trip_id IS DISTINCT FROM NEW.gt_trip_id) THEN
    IF OLD.gt_trip_id IS NOT NULL THEN
      PERFORM recalculate_session_counters(OLD.gt_trip_id);
    END IF;
  END IF;

  IF target_session_id IS NOT NULL THEN
    PERFORM recalculate_session_counters(target_session_id);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_route_session_counters ON ops_dispatch_log;
CREATE TRIGGER trigger_update_route_session_counters
AFTER INSERT OR UPDATE OR DELETE ON ops_dispatch_log
FOR EACH ROW
EXECUTE FUNCTION update_ops_route_session_counters();
