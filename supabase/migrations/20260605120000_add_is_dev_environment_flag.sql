-- Add is_dev environment separation flag to enable dev/production separation on a single Supabase project
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.evidence_files ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.tenant_checklists ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.official_letters ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.access_requests ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.tenant_qr_logins ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.signup_codes ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE NOT NULL;

-- Redefine handle_new_user to handle raw_user_meta_data.is_dev
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  default_building_id uuid;
  is_dev_flag boolean;
BEGIN
  -- Get the first available building, or create a default one if none exists
  SELECT id INTO default_building_id FROM public.buildings LIMIT 1;
  
  IF default_building_id IS NULL THEN
    INSERT INTO public.buildings (name, address, floors, total_units)
    VALUES ('Default Building', '123 SF Street', 5, 20)
    RETURNING id INTO default_building_id;
  END IF;

  is_dev_flag := COALESCE((new.raw_user_meta_data->>'is_dev')::boolean, false);

  INSERT INTO public.tenants (
    id,
    building_id,
    first_name,
    last_name,
    unit_number,
    role,
    is_dev
  )
  VALUES (
    new.id,
    default_building_id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    CAST(new.raw_user_meta_data->>'unit_number' AS integer),
    'tenant',
    is_dev_flag
  );
  
  -- Automatically assign all global checklist templates to the new tenant
  INSERT INTO public.tenant_checklists (tenant_id, template_id, status, is_dev)
  SELECT new.id, id, 'pending', is_dev_flag
  FROM public.checklist_templates
  WHERE is_global = true;
  
  RETURN new;
END;
$function$;

-- Redefine admin_create_tenant_with_qr function to support environment flag
CREATE OR REPLACE FUNCTION public.admin_create_tenant_with_qr(
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_unit_number INTEGER,
    p_password TEXT,
    p_is_dev BOOLEAN DEFAULT false
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
            'onboarding_completed', true,
            'is_dev', p_is_dev
        ),
        now(),
        now()
    )
    RETURNING id INTO new_user_id;

    -- 2. Update the public.tenants table (which gets auto-inserted by trigger)
    UPDATE public.tenants
    SET email = p_email,
        is_lightweight = true,
        is_dev = p_is_dev
    WHERE id = new_user_id;

    -- 3. Insert into public.tenant_qr_logins
    INSERT INTO public.tenant_qr_logins (tenant_id, email, password_plain, is_dev)
    VALUES (new_user_id, p_email, p_password, p_is_dev)
    RETURNING token INTO new_token;

    RETURN new_token;
END;
$$ LANGUAGE plpgsql;
