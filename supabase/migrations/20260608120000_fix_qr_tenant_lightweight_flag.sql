-- Update any existing tenants created via QR to be full accounts
UPDATE public.tenants
SET is_lightweight = false
WHERE id IN (SELECT tenant_id FROM public.tenant_qr_logins);

-- Update the raw_user_meta_data for these users as well
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{is_lightweight}', 'false')
WHERE id IN (SELECT tenant_id FROM public.tenant_qr_logins);

-- Redefine admin_create_tenant_with_qr function to set is_lightweight = false
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
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
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
            'is_lightweight', false,
            'onboarding_completed', true,
            'is_dev', p_is_dev
        ),
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO new_user_id;

    -- 2. Update the public.tenants table (which gets auto-inserted by trigger)
    UPDATE public.tenants
    SET email = p_email,
        is_lightweight = false,
        is_dev = p_is_dev
    WHERE id = new_user_id;

    -- 3. Insert into public.tenant_qr_logins
    INSERT INTO public.tenant_qr_logins (tenant_id, email, password_plain, is_dev)
    VALUES (new_user_id, p_email, p_password, p_is_dev)
    RETURNING token INTO new_token;

    RETURN new_token;
END;
$$ LANGUAGE plpgsql;
