-- Add lightweight account support
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS is_lightweight BOOLEAN DEFAULT false;

-- Table for signup codes (for QR codes / SMS links)
CREATE TABLE IF NOT EXISTS public.signup_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    unit_number TEXT NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id)
);

-- Table for Checklist Templates (The forms/tasks)
CREATE TABLE IF NOT EXISTS public.checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    form_url TEXT,
    is_global BOOLEAN DEFAULT false, -- If true, assigned to everyone automatically
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id)
);

-- Table for Tenant Checklists (The actual assigned tasks)
CREATE TABLE IF NOT EXISTS public.tenant_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES auth.users(id) NOT NULL,
    template_id UUID REFERENCES public.checklist_templates(id) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    deadline DATE,
    admin_read BOOLEAN DEFAULT false,
    sent_to_attorney BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, template_id)
);

-- Row Level Security
ALTER TABLE public.signup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_checklists ENABLE ROW LEVEL SECURITY;

-- Signup Codes Policies
CREATE POLICY "Admins can manage signup codes" 
    ON public.signup_codes FOR ALL 
    USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Anyone can view unused signup codes" 
    ON public.signup_codes FOR SELECT 
    USING (is_used = false);

-- Checklist Templates Policies
CREATE POLICY "Admins can manage checklist templates" 
    ON public.checklist_templates FOR ALL 
    USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Tenants can view checklist templates" 
    ON public.checklist_templates FOR SELECT 
    USING (true);

-- Tenant Checklists Policies
CREATE POLICY "Admins can manage all tenant checklists" 
    ON public.tenant_checklists FOR ALL 
    USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Tenants can view and update their own checklists" 
    ON public.tenant_checklists FOR SELECT 
    USING (tenant_id = auth.uid());
CREATE POLICY "Tenants can update their own checklists" 
    ON public.tenant_checklists FOR UPDATE 
    USING (tenant_id = auth.uid());

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenant_checklists;
