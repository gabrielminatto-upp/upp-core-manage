-- Remove the duplicate trigger that's causing the constraint violation
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Verify only one trigger remains active for user creation
-- The on_auth_user_created trigger should be the only one remaining