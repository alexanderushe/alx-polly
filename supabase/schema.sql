-- Create the polls table
CREATE TABLE polls (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  creator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create the votes table
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  option TEXT NOT NULL,
  voter_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create the get_vote_counts function
CREATE OR REPLACE FUNCTION get_vote_counts(poll_id_param integer)
RETURNS TABLE(option text, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT v.option, COUNT(v.id)
  FROM votes v
  WHERE v.poll_id = poll_id_param
  GROUP BY v.option;
END;
$$;
