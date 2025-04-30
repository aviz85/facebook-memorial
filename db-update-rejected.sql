-- Add rejected column to fallen table
ALTER TABLE public.fallen 
ADD COLUMN rejected BOOLEAN DEFAULT FALSE;

-- Update any existing approved records
-- This ensures no record is both approved and rejected
UPDATE public.fallen 
SET rejected = FALSE 
WHERE approved = TRUE;

-- Create index on rejected status for faster queries
CREATE INDEX idx_fallen_rejected ON public.fallen(rejected); 