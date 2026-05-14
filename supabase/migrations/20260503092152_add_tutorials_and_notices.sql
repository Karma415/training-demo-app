-- Create page_tutorials table
CREATE TABLE IF NOT EXISTS public.page_tutorials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_path TEXT NOT NULL UNIQUE,
    video_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.page_tutorials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.page_tutorials FOR SELECT USING (true);
CREATE POLICY "Enable all access for admins" ON public.page_tutorials USING (
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.id = auth.uid() AND (tenants.role = 'admin' OR tenants.role = 'superadmin')
  )
);

-- Create official_letters table
CREATE TABLE IF NOT EXISTS public.official_letters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    audio_url TEXT,
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'tenant')),
    tenant_id UUID REFERENCES public.tenants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE public.official_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view their own or global letters" ON public.official_letters FOR SELECT USING (
    target_type = 'all' OR tenant_id = auth.uid()
);
CREATE POLICY "Enable all access for admins" ON public.official_letters USING (
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.id = auth.uid() AND (tenants.role = 'admin' OR tenants.role = 'superadmin')
  )
);

-- Insert Storage Bucket 'letters'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('letters', 'letters', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for 'letters'
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'letters');
CREATE POLICY "Admin Insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'letters' AND 
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.id = auth.uid() AND (tenants.role = 'admin' OR tenants.role = 'superadmin')
  )
);
