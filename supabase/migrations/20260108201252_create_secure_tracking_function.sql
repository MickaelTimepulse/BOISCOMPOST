/*
  # Création d'une fonction sécurisée pour le tracking client

  1. Fonction créée
    - get_client_by_tracking_token(token) : retourne les informations du client de manière sécurisée
    - Cette fonction vérifie le tracking_token et retourne uniquement les données du client correspondant
  
  2. Sécurité
    - La fonction est SECURITY DEFINER mais vérifie le tracking_token avant de retourner les données
    - Seules les informations nécessaires sont retournées (id, name, tracking_token)
    - Pas d'injection SQL possible car on utilise des paramètres typés
*/

-- Créer une fonction sécurisée pour récupérer un client par son tracking token
CREATE OR REPLACE FUNCTION get_client_by_tracking_token(token UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  tracking_token UUID,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.tracking_token,
    c.is_active
  FROM clients c
  WHERE c.tracking_token = token
  AND c.is_active = true;
END;
$$;

-- Permettre l'exécution par les utilisateurs anonymes
GRANT EXECUTE ON FUNCTION get_client_by_tracking_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_client_by_tracking_token(UUID) TO authenticated;
