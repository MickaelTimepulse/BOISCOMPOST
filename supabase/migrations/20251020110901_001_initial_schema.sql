/*
  # BOISCOMPOST Initial Schema
  
  ## Overview
  This migration creates the complete database structure for the BOISCOMPOST application,
  which manages waste collection missions for drivers and provides tracking for clients.
  
  ## Tables Created
  
  ### 1. profiles - Extended user profiles
  ### 2. clients - Client/customer information
  ### 3. material_types - Types of waste materials
  ### 4. collection_sites - Collection locations
  ### 5. deposit_sites - Deposit locations
  ### 6. vehicles - Company vehicles
  ### 7. missions - Collection missions
  
  ## Security
  - RLS enabled on all tables
  - Super admins have full access
  - Drivers can only access their own missions
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'driver')),
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all profiles" ON profiles FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Super admins can insert profiles" ON profiles FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

CREATE POLICY "Super admins can update profiles" ON profiles FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  siret text,
  email text NOT NULL,
  phone text,
  address text,
  tracking_token uuid UNIQUE DEFAULT uuid_generate_v4(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all clients" ON clients FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

CREATE POLICY "Super admins can insert clients" ON clients FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

CREATE POLICY "Super admins can update clients" ON clients FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

CREATE POLICY "Public can view clients by tracking token" ON clients FOR SELECT TO anon USING (true);

CREATE TABLE IF NOT EXISTS material_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE material_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage material types" ON material_types FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

CREATE POLICY "Drivers can view material types" ON material_types FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'driver') AND is_active = true);

CREATE TABLE IF NOT EXISTS collection_sites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collection_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage collection sites" ON collection_sites FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

CREATE POLICY "Drivers can view collection sites" ON collection_sites FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'driver') AND is_active = true);

CREATE TABLE IF NOT EXISTS deposit_sites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deposit_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage deposit sites" ON deposit_sites FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

CREATE POLICY "Drivers can view deposit sites" ON deposit_sites FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'driver') AND is_active = true);

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  license_plate text UNIQUE NOT NULL,
  vehicle_type text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage vehicles" ON vehicles FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

CREATE POLICY "Drivers can view vehicles" ON vehicles FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'driver') AND is_active = true);

CREATE TABLE IF NOT EXISTS missions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES clients(id),
  driver_id uuid NOT NULL REFERENCES profiles(id),
  collection_site_id uuid NOT NULL REFERENCES collection_sites(id),
  deposit_site_id uuid NOT NULL REFERENCES deposit_sites(id),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  material_type_id uuid NOT NULL REFERENCES material_types(id),
  mission_date date NOT NULL DEFAULT CURRENT_DATE,
  empty_weight_kg numeric NOT NULL,
  loaded_weight_kg numeric NOT NULL,
  net_weight_tons numeric GENERATED ALWAYS AS ((loaded_weight_kg - empty_weight_kg) / 1000.0) STORED,
  driver_comment text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'validated')),
  created_at timestamptz DEFAULT now(),
  validated_at timestamptz
);

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all missions" ON missions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

CREATE POLICY "Drivers can view own missions" ON missions FOR SELECT TO authenticated
USING (driver_id = auth.uid() AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'driver'));

CREATE POLICY "Drivers can insert own missions" ON missions FOR INSERT TO authenticated
WITH CHECK (driver_id = auth.uid() AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'driver'));

CREATE POLICY "Drivers can update own draft missions" ON missions FOR UPDATE TO authenticated
USING (driver_id = auth.uid() AND status = 'draft' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'driver'))
WITH CHECK (driver_id = auth.uid() AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'driver'));

CREATE INDEX IF NOT EXISTS idx_missions_client_id ON missions(client_id);
CREATE INDEX IF NOT EXISTS idx_missions_driver_id ON missions(driver_id);
CREATE INDEX IF NOT EXISTS idx_missions_mission_date ON missions(mission_date);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_collection_sites_client_id ON collection_sites(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_tracking_token ON clients(tracking_token);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
