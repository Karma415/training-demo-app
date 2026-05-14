-- Drop the valid_issue_category constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.constraint_column_usage 
    WHERE table_name = 'issues' AND constraint_name = 'valid_issue_category'
  ) THEN
    ALTER TABLE issues DROP CONSTRAINT valid_issue_category;
  END IF;
END $$;
