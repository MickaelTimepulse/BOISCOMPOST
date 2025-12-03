/*
  # Add public access to collection sites

  1. Changes
    - Add RLS policy to allow anyone (authenticated or not) to view active collection sites
    - This is needed for the client tracking page where clients use a tracking token instead of authentication

  2. Security
    - Read-only access for all users
    - Only active sites are visible
*/

CREATE POLICY "Anyone can view active collection sites"
  ON collection_sites FOR SELECT
  TO public
  USING (is_active = true);
