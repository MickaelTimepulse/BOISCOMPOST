/*
  # Ajout des champs de mission client

  1. Modifications
    - Ajout de la colonne `client_mission_id` dans `mission_requests`
      - Permet de stocker l'identifiant de mission fourni par le client
      - Type: text (pour accepter des formats variés)
    - Ajout de la colonne `client_request_date` dans `mission_requests`
      - Permet de stocker la date de la demande côté client
      - Type: date
      - Valeur par défaut: date du jour

  2. Notes
    - Ces champs facilitent le suivi des demandes clients
    - L'ID client permet la correspondance avec leurs systèmes internes
*/

-- Ajout de la colonne pour l'ID de mission client
ALTER TABLE mission_requests 
ADD COLUMN IF NOT EXISTS client_mission_id text;

-- Ajout de la colonne pour la date de demande client
ALTER TABLE mission_requests 
ADD COLUMN IF NOT EXISTS client_request_date date DEFAULT CURRENT_DATE;
