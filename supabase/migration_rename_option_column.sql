-- Migration to rename 'option' column to 'selected_option' in votes table
-- Run this script in your Supabase SQL editor

-- First, check if the column exists with the old name
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'votes'
        AND column_name = 'option'
        AND table_schema = 'public'
    ) THEN
        -- Rename the column
        ALTER TABLE votes RENAME COLUMN option TO selected_option;

        -- Update the function to use the new column name
        CREATE OR REPLACE FUNCTION get_vote_counts(poll_id_param integer)
        RETURNS TABLE(option text, count bigint)
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT v.selected_option, COUNT(v.id)
          FROM votes v
          WHERE v.poll_id = poll_id_param
          GROUP BY v.selected_option;
        END;
        $$;

        RAISE NOTICE 'Successfully renamed option column to selected_option';
    ELSE
        RAISE NOTICE 'Column option does not exist or already renamed to selected_option';
    END IF;
END $$;

-- Verify the change
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'votes'
AND table_schema = 'public'
ORDER BY ordinal_position;
