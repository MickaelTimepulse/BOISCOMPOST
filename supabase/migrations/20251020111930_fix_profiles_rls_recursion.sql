/*
  # Fix Infinite Recursion in Profiles RLS Policies

  ## Problem
  The current RLS policies on the profiles table cause infinite recursion because they
  query the profiles table itself to check user roles, which triggers the same policy again.

  ## Solution
  Drop existing recursive policies and create new ones that:
  1. Allow users to always view their own profile (no recursion)
  2. Use a security definer function to safely check if a user is super_admin
  3. Apply proper permissions for super_admins using the function

  ## Changes
  - Drop all existing policies on profiles table
  - Create a security definer function to check super_admin status
  - Create new non-recursive policies using direct auth.uid() checks and the function
*/

-- Drop existing recursive policies
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update profiles" ON profiles;

-- Create a security definer function to check if user is super_admin
-- This breaks the recursion by using a function with elevated privileges
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'super_admin' AND is_active = true
  );
$$;

-- Policy: Users can always view their own profile (no recursion)
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy: Super admins can view all profiles (uses function to avoid recursion)
CREATE POLICY "Super admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Policy: Super admins can insert profiles
CREATE POLICY "Super admins can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

-- Policy: Super admins can update all profiles
CREATE POLICY "Super admins can update profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Policy: Super admins can delete profiles
CREATE POLICY "Super admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (is_super_admin(auth.uid()));
