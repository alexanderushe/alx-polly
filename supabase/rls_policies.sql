-- RLS (Row Level Security) Policies for Polly App

-- Enable RLS on polls table (if not already enabled)
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- Enable RLS on votes table (if not already enabled)
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLLS TABLE POLICIES
-- =====================================================

-- Policy: Allow authenticated users to view all polls that are currently active
-- (polls that have started and haven't ended yet, or have no time restrictions)
CREATE POLICY "Users can view active polls" ON polls
FOR SELECT
TO authenticated
USING (
  -- Poll has no start time restriction OR start time has passed
  (start_time IS NULL OR start_time <= now())
  AND
  -- Poll has no end time restriction OR end time hasn't passed yet
  (end_time IS NULL OR end_time >= now())
);

-- Policy: Allow authenticated users to view all their own polls (regardless of timing)
CREATE POLICY "Users can view their own polls" ON polls
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- Policy: Allow authenticated users to create polls
CREATE POLICY "Users can create polls" ON polls
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Policy: Allow users to update their own polls
CREATE POLICY "Users can update their own polls" ON polls
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Policy: Allow users to delete their own polls
CREATE POLICY "Users can delete their own polls" ON polls
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- =====================================================
-- VOTES TABLE POLICIES
-- =====================================================

-- Policy: Allow authenticated users to view all votes
-- (needed for vote counting and results display)
CREATE POLICY "Users can view all votes" ON votes
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to cast votes
-- (they can only insert votes with their own user ID)
CREATE POLICY "Users can cast votes" ON votes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = voter_id);

-- Policy: Allow users to view their own votes
-- (for the "My Votes" page)
CREATE POLICY "Users can view their own votes" ON votes
FOR SELECT
TO authenticated
USING (auth.uid() = voter_id);

-- Policy: Prevent users from updating or deleting votes
-- (votes should be immutable once cast)
-- Note: No UPDATE or DELETE policies means these operations are blocked

-- =====================================================
-- ADDITIONAL SECURITY FUNCTIONS
-- =====================================================

-- Function to check if a poll is currently active (can be voted on)
CREATE OR REPLACE FUNCTION is_poll_active(poll_id_param integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    poll_start_time timestamptz;
    poll_end_time timestamptz;
BEGIN
    SELECT start_time, end_time
    INTO poll_start_time, poll_end_time
    FROM polls
    WHERE id = poll_id_param;

    -- Poll is active if:
    -- 1. No start time OR start time has passed
    -- AND
    -- 2. No end time OR end time hasn't passed yet
    RETURN (
        (poll_start_time IS NULL OR poll_start_time <= now())
        AND
        (poll_end_time IS NULL OR poll_end_time >= now())
    );
END;
$$;

-- Function to check if user has already voted on a specific poll
CREATE OR REPLACE FUNCTION has_user_voted(poll_id_param integer, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM votes
        WHERE poll_id = poll_id_param
        AND voter_id = user_id_param
    );
END;
$$;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

-- These policies ensure that:
--
-- 1. POLLS:
--    - Users can see active polls (within their time window)
--    - Users can always see their own polls (even if not active)
--    - Users can create, update, and delete only their own polls
--
-- 2. VOTES:
--    - Users can see all votes (needed for displaying results)
--    - Users can only cast votes as themselves
--    - Votes cannot be updated or deleted (immutable)
--
-- 3. SECURITY:
--    - All operations require authentication
--    - Users cannot impersonate others
--    - Time-based poll visibility is enforced at the database level
--    - Vote integrity is maintained

-- To verify these policies are working, you can run:
-- SELECT * FROM pg_policies WHERE tablename IN ('polls', 'votes');
