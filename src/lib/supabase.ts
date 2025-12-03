import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'driver';
  phone?: string;
  is_active: boolean;
  created_at: string;
};

export type Client = {
  id: string;
  name: string;
  siret?: string;
  email: string;
  phone?: string;
  address?: string;
  tracking_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MaterialType = {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
};

export type CollectionSite = {
  id: string;
  client_id: string;
  name: string;
  address: string;
  is_active: boolean;
  created_at: string;
};

export type DepositSite = {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
  created_at: string;
};

export type Vehicle = {
  id: string;
  name: string;
  license_plate: string;
  vehicle_type: string;
  is_active: boolean;
  created_at: string;
};

export type Mission = {
  id: string;
  client_id: string;
  driver_id: string;
  collection_site_id: string;
  deposit_site_id: string;
  vehicle_id: string;
  material_type_id: string;
  mission_date: string;
  empty_weight_kg: number;
  loaded_weight_kg: number;
  net_weight_tons: number;
  driver_comment?: string;
  status: 'draft' | 'completed' | 'validated';
  created_at: string;
  validated_at?: string;
};

export type MissionWithDetails = Mission & {
  client: Client;
  driver: Profile;
  collection_site: CollectionSite;
  deposit_site: DepositSite;
  vehicle: Vehicle;
  material_type: MaterialType;
};
