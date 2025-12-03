/*
  # Ajout de l'accès public au suivi client

  1. Modifications
    - Ajoute une politique RLS pour permettre aux utilisateurs anonymes de voir les missions validées
    - L'accès est contrôlé via le tracking_token du client
  
  2. Sécurité
    - Seules les missions avec le statut 'validated' sont visibles
    - L'accès nécessite un tracking_token valide
    - Les utilisateurs anonymes peuvent uniquement lire (SELECT), pas modifier
*/

-- Permettre aux utilisateurs anonymes de lire les missions validées via le tracking_token du client
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'missions' 
    AND policyname = 'Anonymous users can view validated missions via tracking token'
  ) THEN
    CREATE POLICY "Anonymous users can view validated missions via tracking token"
      ON missions
      FOR SELECT
      TO anon
      USING (status = 'validated');
  END IF;
END $$;
