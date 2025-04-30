-- Add connection_context column to fallen table
ALTER TABLE public.fallen 
ADD COLUMN connection_context TEXT;

-- Create table for tracking IP-based rate limiting
CREATE TABLE public.submission_rate_limit (
    ip_address TEXT PRIMARY KEY,
    submission_count INTEGER DEFAULT 1,
    last_submission TIMESTAMPTZ DEFAULT now(),
    first_submission TIMESTAMPTZ DEFAULT now()
);

-- Create function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_submission_rate_limit(ip TEXT, limit_count INTEGER DEFAULT 5, cooldown_minutes INTEGER DEFAULT 60)
RETURNS BOOLEAN AS $$
DECLARE
    existing_record RECORD;
    can_submit BOOLEAN;
BEGIN
    -- Look for existing rate limit record for this IP
    SELECT * INTO existing_record FROM public.submission_rate_limit 
    WHERE ip_address = ip;
    
    IF existing_record IS NULL THEN
        -- First submission from this IP
        INSERT INTO public.submission_rate_limit (ip_address) VALUES (ip);
        RETURN TRUE;
    ELSE
        -- Check if we're in cooldown period after hitting limit
        IF existing_record.submission_count >= limit_count AND 
           (EXTRACT(EPOCH FROM (now() - existing_record.last_submission))/60) < cooldown_minutes THEN
            -- Rate limited
            RETURN FALSE;
        ELSIF (EXTRACT(EPOCH FROM (now() - existing_record.last_submission))/60) >= cooldown_minutes THEN
            -- Cooldown period has passed, reset counter
            UPDATE public.submission_rate_limit SET 
                submission_count = 1,
                last_submission = now(),
                first_submission = now()
            WHERE ip_address = ip;
            RETURN TRUE;
        ELSE
            -- Increment counter
            UPDATE public.submission_rate_limit SET 
                submission_count = submission_count + 1,
                last_submission = now()
            WHERE ip_address = ip;
            RETURN TRUE;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up RLS for the rate limit table
ALTER TABLE public.submission_rate_limit ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access rate limit table
CREATE POLICY "Service role only" ON public.submission_rate_limit
    FOR ALL TO service_role
    USING (true);

-- Revoke direct access from anon and authenticated users
REVOKE ALL ON public.submission_rate_limit FROM anon, authenticated; 