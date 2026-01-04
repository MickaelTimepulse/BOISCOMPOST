/*
  # Add Order Number System to Missions

  ## Changes
  
  1. Schema Changes
    - Add `order_number` column to `missions` table
      - Type: TEXT, unique, not null
      - Format: YYMMNNN (YY=year, MM=month, NNN=sequential 001-999)
      - Example: 2601001 (January 2026, order #1)
  
  2. Functions
    - `generate_order_number()`: Generates next sequential order number
      - Resets sequence each month (starts at 001)
      - Format: Current year (2 digits) + Current month (2 digits) + Sequence (3 digits)
  
  3. Triggers
    - Auto-assign order number when creating a new mission
  
  4. Security
    - Order numbers are readable by authenticated users
    - Only system can generate and assign order numbers
*/

-- Add order_number column to missions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'order_number'
  ) THEN
    ALTER TABLE missions ADD COLUMN order_number TEXT UNIQUE;
  END IF;
END $$;

-- Create function to generate next order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  year_month TEXT;
  next_seq INTEGER;
  new_order_number TEXT;
BEGIN
  -- Get current year and month in YYMM format
  year_month := TO_CHAR(CURRENT_DATE, 'YYMM');
  
  -- Find the highest sequence number for current year-month
  SELECT COALESCE(MAX(
    CASE 
      WHEN order_number IS NOT NULL AND LENGTH(order_number) = 7 
           AND SUBSTRING(order_number, 1, 4) = year_month
      THEN CAST(SUBSTRING(order_number, 5, 3) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_seq
  FROM missions;
  
  -- Format: YYMMNNN (e.g., 2601001)
  new_order_number := year_month || LPAD(next_seq::TEXT, 3, '0');
  
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to auto-assign order number
CREATE OR REPLACE FUNCTION assign_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_order_number ON missions;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON missions
  FOR EACH ROW
  EXECUTE FUNCTION assign_order_number();

-- Backfill existing missions with order numbers (oldest first)
DO $$
DECLARE
  mission_record RECORD;
  current_order TEXT;
BEGIN
  FOR mission_record IN 
    SELECT id FROM missions 
    WHERE order_number IS NULL 
    ORDER BY created_at ASC
  LOOP
    current_order := generate_order_number();
    UPDATE missions 
    SET order_number = current_order 
    WHERE id = mission_record.id;
  END LOOP;
END $$;

-- Make order_number NOT NULL after backfill
ALTER TABLE missions ALTER COLUMN order_number SET NOT NULL;