CREATE TABLE public.access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    unit_number TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for requesting approval
CREATE POLICY "Allow anonymous insert access requests" ON public.access_requests
    FOR INSERT WITH CHECK (true);

-- Allow authenticated admins/legal counsel to read/write access requests
CREATE POLICY "Allow admin/legal_counsel read access requests" ON public.access_requests
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenants
            WHERE tenants.id = auth.uid()
            AND tenants.role IN ('admin', 'superadmin', 'legal_counsel')
        )
    );

CREATE POLICY "Allow admin/legal_counsel update access requests" ON public.access_requests
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenants
            WHERE tenants.id = auth.uid()
            AND tenants.role IN ('admin', 'superadmin', 'legal_counsel')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tenants
            WHERE tenants.id = auth.uid()
            AND tenants.role IN ('admin', 'superadmin', 'legal_counsel')
        )
    );
