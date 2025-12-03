/*
  # Add delete policy for mission requests

  1. Changes
    - Add RLS policy to allow super_admin to delete mission requests

  2. Security
    - Only super_admin can delete mission requests
*/

CREATE POLICY "Super admins can delete mission requests"
  ON mission_requests FOR DELETE
  TO authenticated
  USING (is_super_admin(auth.uid()));