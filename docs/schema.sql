-- Enum Types
CREATE TYPE profile_role AS ENUM ('admin', 'supervisor', 'ground');
CREATE TYPE lookup_domain AS ENUM ('TICKET', 'kra_status');
CREATE TYPE kra_priority AS ENUM ('high', 'medium', 'low');

-- Layer 1: Master Data & Configuration
CREATE TABLE core_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text NOT NULL,
  phone text,
  role profile_role NOT NULL,
  is_active boolean DEFAULT true,
  last_login_at timestamptz
);

CREATE TABLE core_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  vehicle_no text NOT NULL UNIQUE,
  driver_name text,
  is_active boolean DEFAULT true
);

CREATE TABLE cfg_lookups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  domain lookup_domain NOT NULL,
  status text NOT NULL,
  sub_status text,
  is_terminal boolean DEFAULT false,
  order_idx integer DEFAULT 0,
  is_active boolean DEFAULT true,
  UNIQUE(domain, status, sub_status)
);

CREATE TABLE cfg_ticket_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  parent_category_id uuid REFERENCES cfg_ticket_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  icon_name text,
  color text,
  is_active boolean DEFAULT true
);
CREATE UNIQUE INDEX idx_active_category_name ON cfg_ticket_categories (name) WHERE is_active = true;

CREATE TABLE cfg_geo_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area text,
  pincode text UNIQUE,
  lat numeric,
  lng numeric,
  zone text,
  city text
);

-- Layer 2: Operations
CREATE TABLE ops_manifest_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES core_profiles(id),
  uploaded_at timestamptz DEFAULT now(),
  ticket_count integer DEFAULT 0
);

CREATE TABLE ops_staged_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES ops_manifest_batches(id) ON DELETE CASCADE,
  ticket_id text NOT NULL,
  date date NOT NULL,
  category text,
  sub_category text,
  contact_name text,
  address1 text,
  pincode text,
  phone text,
  ticket_age integer,
  raw_tags text,
  UNIQUE(ticket_id, date)
);

CREATE TABLE ops_ticket_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id text NOT NULL,
  staged_ticket_id uuid REFERENCES ops_staged_tickets(id) ON DELETE CASCADE,
  contact_name text,
  location text,
  pincode text,
  notes text,
  updated_by uuid REFERENCES core_profiles(id),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE ops_route_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  trip_date date NOT NULL,
  vehicle_id uuid REFERENCES core_vehicles(id),
  driver_name text,
  gt1_id uuid REFERENCES core_profiles(id),
  gt2_id uuid REFERENCES core_profiles(id),
  total_km numeric DEFAULT 0,
  updated_by uuid REFERENCES core_profiles(id),
  UNIQUE(trip_date, vehicle_id)
);

CREATE TABLE ops_dispatch_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  ticket_id text NOT NULL,
  scheduled_date date NOT NULL,
  sub_category text,
  contact_name text,
  location text,
  pincode text,
  notes text,
  route text,
  remarks text,
  gt_map text,
  gt_trip_id uuid REFERENCES ops_route_sessions(id) ON DELETE SET NULL,
  status text,
  sub_status text,
  updated_by uuid REFERENCES core_profiles(id),
  UNIQUE(ticket_id, scheduled_date)
);

CREATE TABLE ops_warehouse_duty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duty_date date NOT NULL UNIQUE,
  created_by uuid REFERENCES core_profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE ops_duty_crew (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duty_id uuid REFERENCES ops_warehouse_duty(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES core_profiles(id) ON DELETE CASCADE,
  UNIQUE(duty_id, profile_id)
);

CREATE TABLE ops_kra_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  priority kra_priority DEFAULT 'medium',
  default_assignee_id uuid REFERENCES core_profiles(id),
  default_status text,
  is_active boolean DEFAULT true
);

CREATE TABLE ops_kra_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kra_id uuid REFERENCES ops_kra_master(id) ON DELETE CASCADE,
  target_date date NOT NULL,
  status text,
  remark text,
  updated_by uuid REFERENCES core_profiles(id),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(kra_id, target_date)
);

CREATE TABLE ops_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  content text,
  is_pinned boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  created_by uuid REFERENCES core_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Layer 3: Audit & History
CREATE TABLE log_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  actor_id uuid REFERENCES core_profiles(id),
  table_name text NOT NULL,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb
);

CREATE TABLE log_ticket_lifecycle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  ticket_id text NOT NULL,
  old_status text,
  new_status text,
  changed_by uuid REFERENCES core_profiles(id)
);

CREATE TABLE daily_schedule_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  data jsonb NOT NULL
);

-- Layer 4: Analytics (OLAP TABLES & VIEWS)
CREATE TABLE fact_dispatch_lifecycle (
  dispatch_log_id uuid PRIMARY KEY REFERENCES ops_dispatch_log(id) ON DELETE CASCADE,
  ticket_id text NOT NULL,
  scheduled_date date NOT NULL,
  status text,
  sub_status text,
  completed_at timestamptz,
  gt1_id uuid,
  gt2_id uuid
);

CREATE OR REPLACE VIEW fact_crew_daily_stats AS
SELECT 
  crew.profile_id,
  rs.trip_date AS date,
  COUNT(f.dispatch_log_id) AS total_assigned,
  SUM(CASE WHEN f.completed_at IS NOT NULL THEN 1 ELSE 0 END) AS total_done,
  CASE 
    WHEN COUNT(f.dispatch_log_id) = 0 THEN 0 
    ELSE (SUM(CASE WHEN f.completed_at IS NOT NULL THEN 1 ELSE 0 END)::numeric / COUNT(f.dispatch_log_id)) * 100 
  END AS success_rate
FROM ops_route_sessions rs
JOIN ops_dispatch_log dl ON rs.id = dl.gt_trip_id
JOIN fact_dispatch_lifecycle f ON dl.id = f.dispatch_log_id
JOIN LATERAL (
  SELECT rs.gt1_id AS profile_id UNION SELECT rs.gt2_id
) crew ON crew.profile_id IS NOT NULL
GROUP BY crew.profile_id, rs.trip_date;

CREATE OR REPLACE VIEW latest_dispatch_logs AS
SELECT DISTINCT ON (ticket_id) *
FROM ops_dispatch_log
ORDER BY ticket_id, scheduled_date DESC;

CREATE OR REPLACE VIEW daily_route_summary AS
SELECT 
  rs.id AS route_id,
  rs.trip_date,
  rs.vehicle_id,
  rs.driver_name,
  COUNT(f.dispatch_log_id) AS total_tickets,
  SUM(CASE WHEN f.completed_at IS NOT NULL THEN 1 ELSE 0 END) AS completed_tickets
FROM ops_route_sessions rs
LEFT JOIN ops_dispatch_log dl ON rs.id = dl.gt_trip_id
LEFT JOIN fact_dispatch_lifecycle f ON dl.id = f.dispatch_log_id
GROUP BY rs.id, rs.trip_date, rs.vehicle_id, rs.driver_name;
