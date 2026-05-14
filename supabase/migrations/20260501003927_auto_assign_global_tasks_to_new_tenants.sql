CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  default_building_id uuid;
BEGIN
  -- Get the first available building, or create a default one if none exists
  SELECT id INTO default_building_id FROM public.buildings LIMIT 1;
  
  IF default_building_id IS NULL THEN
    INSERT INTO public.buildings (name, address, floors, total_units)
    VALUES ('Default Building', '123 SF Street', 5, 20)
    RETURNING id INTO default_building_id;
  END IF;

  INSERT INTO public.tenants (
    id,
    building_id,
    first_name,
    last_name,
    unit_number,
    role
  )
  VALUES (
    new.id,
    default_building_id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    CAST(new.raw_user_meta_data->>'unit_number' AS integer),
    'tenant'
  );
  
  -- Automatically assign all global checklist templates to the new tenant
  INSERT INTO public.tenant_checklists (tenant_id, template_id, status)
  SELECT new.id, id, 'pending'
  FROM public.checklist_templates
  WHERE is_global = true;
  
  RETURN new;
END;
$function$;
