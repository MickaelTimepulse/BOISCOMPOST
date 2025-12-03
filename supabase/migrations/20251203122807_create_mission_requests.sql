/*
  # Create mission requests table

  1. New Tables
    - `mission_requests`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `collection_site_id` (uuid, foreign key to collection_sites)
      - `estimated_weight_tons` (numeric) - Poids estimatif en tonnes
      - `status` (text) - Statut de la demande: 'pending', 'viewed'
      - `created_at` (timestamptz) - Date de création
      - `viewed_by_admin_at` (timestamptz, nullable) - Date de consultation par l'admin
      - `viewed_by_driver_at` (timestamptz, nullable) - Date de consultation par le chauffeur

  2. Security
    - Enable RLS on `mission_requests` table
    - Add policy for clients to insert their own requests
    - Add policy for clients to view their own requests
    - Add policy for super_admin to view all requests
    - Add policy for drivers to view all requests
*/

CREATE TABLE IF NOT EXISTS mission_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  collection_site_id uuid NOT NULL REFERENCES collection_sites(id),
  estimated_weight_tons numeric NOT NULL CHECK (estimated_weight_tons > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed')),
  created_at timestamptz DEFAULT now(),
  viewed_by_admin_at timestamptz,
  viewed_by_driver_at timestamptz
);

ALTER TABLE mission_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can insert their own mission requests"
  ON mission_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_id
    )
  );

CREATE POLICY "Clients can view their own mission requests"
  ON mission_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_id
    )
  );

CREATE POLICY "Super admins can view all mission requests"
  ON mission_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Drivers can view all mission requests"
  ON mission_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'driver'
    )
  );

CREATE POLICY "Super admins can update mission requests"
  ON mission_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Drivers can update mission requests"
  ON mission_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'driver'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'driver'
    )
  );
