/*
  # Correction de failles de sécurité critiques

  1. Problèmes identifiés
    - CRITIQUE : La politique "Public can view clients by tracking token" permet à n'importe qui de voir TOUS les clients (qual = true)
    - CRITIQUE : La politique "Anyone can view mission requests" permet à n'importe qui de voir TOUTES les demandes (qual = true)
    - Les utilisateurs anonymes pouvaient accéder à toutes les données sensibles sans restriction

  2. Corrections appliquées
    - Suppression de la politique permissive sur les clients
    - Suppression de la politique permissive sur les mission_requests
    - Les utilisateurs anonymes NE PEUVENT PLUS accéder aux tables clients et mission_requests
    - Seuls les utilisateurs authentifiés (drivers et super_admins) peuvent accéder à ces données

  3. Impact
    - Les clients devront maintenant utiliser uniquement leurs missions via le tracking token
    - Ils ne pourront plus voir les informations de la table clients directement
    - Les demandes de mission restent possibles en INSERT mais pas en lecture publique
*/

-- CORRECTION CRITIQUE 1 : Supprimer la politique dangereuse sur les clients
DROP POLICY IF EXISTS "Public can view clients by tracking token" ON clients;

-- CORRECTION CRITIQUE 2 : Supprimer la politique dangereuse sur les mission requests
DROP POLICY IF EXISTS "Anyone can view mission requests" ON mission_requests;
DROP POLICY IF EXISTS "Clients can view their own mission requests" ON mission_requests;

-- Créer une politique plus stricte pour mission_requests : seuls les authentifiés peuvent lire
CREATE POLICY "Authenticated users can view mission requests"
  ON mission_requests
  FOR SELECT
  TO authenticated
  USING (
    -- Super admins peuvent tout voir
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR
    -- Drivers peuvent tout voir  
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'driver')
  );

-- Note : Les utilisateurs anonymes ne peuvent plus voir les clients directement
-- Ils accèdent aux missions via le tracking token uniquement (via la table missions)
