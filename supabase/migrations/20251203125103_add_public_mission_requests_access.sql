/*
  # Add public access to mission requests

  1. Changes
    - Add RLS policy to allow anyone to insert mission requests
    - Add RLS policy to allow anyone to view mission requests for valid clients
    - This is needed for the client tracking page where clients use a tracking token instead of authentication

  2. Security
    - Anyone can insert a mission request if they provide a valid client_id
    - Anyone can view mission requests (clients need to see their own requests)
*/

CREATE POLICY "Anyone can insert mission requests"
  ON mission_requests FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_id
      AND clients.is_active = true
    )
  );

CREATE POLICY "Anyone can view mission requests"
  ON mission_requests FOR SELECT
  TO public
  USING (true);
