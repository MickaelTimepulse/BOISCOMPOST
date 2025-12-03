/*
  # Add CASCADE delete for client relationships

  1. Changes
    - Drop existing foreign key constraints on collection_sites, mission_requests, and missions
    - Recreate them with ON DELETE CASCADE to allow client deletion
    
  2. Security
    - No changes to RLS policies
*/

-- Drop existing foreign key constraints
ALTER TABLE collection_sites DROP CONSTRAINT IF EXISTS collection_sites_client_id_fkey;
ALTER TABLE mission_requests DROP CONSTRAINT IF EXISTS mission_requests_client_id_fkey;
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_client_id_fkey;

-- Recreate with CASCADE delete
ALTER TABLE collection_sites 
  ADD CONSTRAINT collection_sites_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES clients(id) 
  ON DELETE CASCADE;

ALTER TABLE mission_requests 
  ADD CONSTRAINT mission_requests_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES clients(id) 
  ON DELETE CASCADE;

ALTER TABLE missions 
  ADD CONSTRAINT missions_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES clients(id) 
  ON DELETE CASCADE;
