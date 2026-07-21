CREATE TABLE IF NOT EXISTS public.ops_custom_batch (
    id integer PRIMARY KEY DEFAULT 1,
    ticket_ids text[] NOT NULL DEFAULT '{}',
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT ensure_single_row CHECK (id = 1)
);

ALTER TABLE public.ops_custom_batch ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON public.ops_custom_batch
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Insert the single row if it doesn't exist
INSERT INTO public.ops_custom_batch (id, ticket_ids) 
VALUES (1, '{}')
ON CONFLICT (id) DO NOTHING;
