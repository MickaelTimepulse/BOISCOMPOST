/*
  # Enable realtime for mission_requests table

  1. Changes
    - Enable realtime subscription for mission_requests table
    - This allows real-time notifications when mission requests are created, updated, or deleted

  2. Purpose
    - Allow the admin dashboard to receive instant notifications when clients create new collection requests
    - Update the pending requests counter in real-time without page refresh
*/

ALTER PUBLICATION supabase_realtime ADD TABLE mission_requests;
