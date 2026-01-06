/*
  # Ajout des champs client dans la table missions

  1. Modifications
    - Ajout de la colonne `client_mission_id` dans `missions`
      - Permet de stocker l'identifiant de mission fourni par le client
      - Type: text (pour accepter des formats variés)
    - Ajout de la colonne `client_request_date` dans `missions`
      - Permet de stocker la date de la demande côté client
      - Type: date
      - Valeur par défaut: date du jour

  2. Notes
    - Ces champs facilitent le suivi des demandes clients dans les missions
    - L'ID client permet la correspondance avec leurs systèmes internes
    - Ces données sont transférées depuis mission_requests lors de la conversion
*/

-- Ajout de la colonne pour l'ID de mission client
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS client_mission_id text;

-- Ajout de la colonne pour la date de demande client
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS client_request_date date DEFAULT CURRENT_DATE;
