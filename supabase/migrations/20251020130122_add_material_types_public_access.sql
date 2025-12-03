/*
  # Ajout de l'accès public aux types de matériaux

  1. Modifications
    - Ajoute une politique RLS pour permettre aux utilisateurs anonymes de voir les types de matériaux
    - Nécessaire pour l'affichage des matériaux dans le suivi client
  
  2. Sécurité
    - Lecture seule (SELECT) pour les utilisateurs anonymes
    - Les types de matériaux sont des données publiques non sensibles
*/

-- Permettre aux utilisateurs anonymes de lire les types de matériaux
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'material_types' 
    AND policyname = 'Anonymous users can view material types'
  ) THEN
    CREATE POLICY "Anonymous users can view material types"
      ON material_types
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;
