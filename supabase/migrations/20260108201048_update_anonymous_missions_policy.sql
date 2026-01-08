/*
  # Mise à jour de la politique d'accès anonyme aux missions

  1. Modifications
    - Suppression de l'ancienne politique qui limitait l'accès aux missions 'validated' uniquement
    - Création d'une nouvelle politique permettant l'accès aux missions 'validated' ET 'completed'
  
  2. Sécurité
    - Les utilisateurs anonymes peuvent maintenant voir toutes les missions terminées (validated et completed)
    - Cette modification permet aux clients d'afficher l'historique complet de leurs collectes via le tracking token
*/

-- Supprimer l'ancienne politique restrictive
DROP POLICY IF EXISTS "Anonymous users can view validated missions via tracking token" ON missions;

-- Créer la nouvelle politique qui inclut les missions completed et validated
CREATE POLICY "Anonymous users can view completed and validated missions"
  ON missions
  FOR SELECT
  TO anon
  USING (status IN ('validated', 'completed'));
