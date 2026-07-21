ALTER TABLE ops_staged_tickets
ADD COLUMN phone text,
ADD COLUMN ticket_age integer,
ADD COLUMN raw_tags text;
