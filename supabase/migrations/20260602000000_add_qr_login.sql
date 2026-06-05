-- Create extension pgcrypto if it does not exist (needed for crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the tenant_qr_logins table
CREATE TABLE IF NOT EXISTS public.tenant_qr_logins (
    token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_plain TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.tenant_qr_logins ENABLE ROW LEVEL SECURITY;

-- Admins can manage QR logins
CREATE POLICY "Admins can manage QR logins" ON public.tenant_qr_logins
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.tenants
        WHERE tenants.id = auth.uid() AND tenants.role IN ('admin', 'superadmin')
    )
);

-- Anyone can retrieve login info via token
CREATE POLICY "Anyone can retrieve login info via token" ON public.tenant_qr_logins
FOR SELECT USING (true);

-- Function to create tenant with QR login token
CREATE OR REPLACE FUNCTION public.admin_create_tenant_with_qr(
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_unit_number INTEGER,
    p_password TEXT
)
RETURNS UUID
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    new_token UUID;
    default_building_id UUID;
BEGIN
    -- Get the building ID
    SELECT id INTO default_building_id FROM public.buildings LIMIT 1;
    IF default_building_id IS NULL THEN
        INSERT INTO public.buildings (name, address)
        VALUES ('Default Building', '123 SF Street')
        RETURNING id INTO default_building_id;
    END IF;

    -- 1. Insert into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object(
            'first_name', p_first_name,
            'last_name', p_last_name,
            'unit_number', p_unit_number,
            'is_lightweight', true,
            'onboarding_completed', true
        ),
        now(),
        now()
    )
    RETURNING id INTO new_user_id;

    -- 2. Update the public.tenants table (which gets auto-inserted by trigger)
    UPDATE public.tenants
    SET email = p_email,
        is_lightweight = true
    WHERE id = new_user_id;

    -- 3. Insert into public.tenant_qr_logins
    INSERT INTO public.tenant_qr_logins (tenant_id, email, password_plain)
    VALUES (new_user_id, p_email, p_password)
    RETURNING token INTO new_token;

    RETURN new_token;
END;
$$ LANGUAGE plpgsql;
