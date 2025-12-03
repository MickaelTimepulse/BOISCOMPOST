/*
  # Add CASCADE delete for sites, materials, and vehicles

  1. Changes
    - Drop existing foreign key constraints on missions and mission_requests
    - Recreate them with ON DELETE CASCADE to allow deletion of:
      - collection_sites
      - deposit_sites
      - material_types
      - vehicles
    
  2. Security
    - No changes to RLS policies
*/

-- Drop existing foreign key constraints for collection_sites
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_collection_site_id_fkey;
ALTER TABLE mission_requests DROP CONSTRAINT IF EXISTS mission_requests_collection_site_id_fkey;

-- Drop existing foreign key constraints for deposit_sites, material_types, vehicles
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_deposit_site_id_fkey;
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_material_type_id_fkey;
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_vehicle_id_fkey;

-- Recreate with CASCADE delete for collection_sites
ALTER TABLE missions 
  ADD CONSTRAINT missions_collection_site_id_fkey 
  FOREIGN KEY (collection_site_id) 
  REFERENCES collection_sites(id) 
  ON DELETE CASCADE;

ALTER TABLE mission_requests 
  ADD CONSTRAINT mission_requests_collection_site_id_fkey 
  FOREIGN KEY (collection_site_id) 
  REFERENCES collection_sites(id) 
  ON DELETE CASCADE;

-- Recreate with CASCADE delete for other tables
ALTER TABLE missions 
  ADD CONSTRAINT missions_deposit_site_id_fkey 
  FOREIGN KEY (deposit_site_id) 
  REFERENCES deposit_sites(id) 
  ON DELETE CASCADE;

ALTER TABLE missions 
  ADD CONSTRAINT missions_material_type_id_fkey 
  FOREIGN KEY (material_type_id) 
  REFERENCES material_types(id) 
  ON DELETE CASCADE;

ALTER TABLE missions 
  ADD CONSTRAINT missions_vehicle_id_fkey 
  FOREIGN KEY (vehicle_id) 
  REFERENCES vehicles(id) 
  ON DELETE CASCADE;
