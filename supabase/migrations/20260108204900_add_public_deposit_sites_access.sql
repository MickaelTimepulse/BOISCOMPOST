/*
  # Ajouter l'accès public aux sites de dépose

  1. Modifications
    - Ajouter une politique RLS permettant aux utilisateurs publics de voir les sites de dépose actifs
    - Similaire à la politique existante pour les sites de collecte

  2. Sécurité
    - Les utilisateurs publics peuvent uniquement voir les sites actifs (is_active = true)
    - Aucune modification ou suppression n'est autorisée
*/

-- Ajouter une politique pour permettre à tous (y compris les non-authentifiés) de voir les sites de dépose actifs
CREATE POLICY "Anyone can view active deposit sites"
  ON deposit_sites
  FOR SELECT
  TO public
  USING (is_active = true);
