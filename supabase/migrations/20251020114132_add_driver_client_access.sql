/*
  # Allow drivers to view clients

  1. Changes
    - Add policy for drivers to view active clients
    
  2. Security
    - Drivers can only SELECT active clients (read-only access)
    - This allows drivers to see the list of clients when creating missions
*/

CREATE POLICY "Drivers can view active clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'driver'
    )
    AND is_active = true
  );
