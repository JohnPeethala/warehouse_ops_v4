-- Remove legacy status columns from ops_dispatch_log
ALTER TABLE ops_dispatch_log 
DROP COLUMN IF EXISTS dt_status,
DROP COLUMN IF EXISTS ticket_status;

-- Add new unified status columns
ALTER TABLE ops_dispatch_log
ADD COLUMN status text,
ADD COLUMN sub_status text;

-- Remove legacy status columns from fact_dispatch_lifecycle
ALTER TABLE fact_dispatch_lifecycle
DROP COLUMN IF EXISTS final_dt_status,
DROP COLUMN IF EXISTS final_ticket_status;

-- Add new unified status columns
ALTER TABLE fact_dispatch_lifecycle
ADD COLUMN status text,
ADD COLUMN sub_status text;

-- Remove the link column from ops_ticket_annotations
ALTER TABLE ops_ticket_annotations 
DROP COLUMN IF EXISTS link;
