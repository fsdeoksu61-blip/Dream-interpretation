-- Remove foreign key constraint on session_id in dream_interpretations table
-- This allows interpretations to be saved even if the session doesn't exist in sessions table

ALTER TABLE dream_interpretations
DROP CONSTRAINT IF EXISTS dream_interpretations_session_id_fkey;

-- Make session_id nullable (it should already be, but ensuring it)
ALTER TABLE dream_interpretations
ALTER COLUMN session_id DROP NOT NULL;
