-- Nutrition data table for Swedish crops
-- Uses Livsmedelsverkets officiella näringsdata för svenska grödor
CREATE TABLE IF NOT EXISTS nutrition_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_name VARCHAR(100) NOT NULL UNIQUE,
  calories_per_100g DECIMAL(6,2) NOT NULL,
  protein DECIMAL(6,2) NOT NULL,
  carbs DECIMAL(6,2) NOT NULL,
  fiber DECIMAL(6,2) NOT NULL,
  fat DECIMAL(6,2) NOT NULL,
  vitamins JSONB NOT NULL DEFAULT '{}',
  minerals JSONB NOT NULL DEFAULT '{}',
  antioxidants TEXT[] DEFAULT '{}',
  health_benefits TEXT[] DEFAULT '{}',
  source VARCHAR(100) DEFAULT 'Livsmedelsverket',
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Swedish nutrition data
INSERT INTO nutrition_data (crop_name, calories_per_100g, protein, carbs, fiber, fat, vitamins, minerals, antioxidants, health_benefits) VALUES
('potatis', 77, 2, 17, 2.2, 0.1, 
 '{"vitaminC": 20, "vitaminA": 0, "vitaminK": 2, "vitaminB6": 0.3, "folate": 15}',
 '{"potassium": 421, "calcium": 12, "iron": 0.8, "magnesium": 23, "phosphorus": 57}',
 '{"Flavonoider", "Klorogensyra"}',
 '{"Stärker immunförsvaret", "Hjälper hjärtat", "Reglerar blodsocker", "Förbättrar matsmältningen"}'
),
('morötter', 41, 0.9, 10, 2.8, 0.2,
 '{"vitaminC": 5.9, "vitaminA": 16706, "vitaminK": 13.2, "vitaminB6": 0.1, "folate": 19}',
 '{"potassium": 320, "calcium": 33, "iron": 0.3, "magnesium": 12, "phosphorus": 35}',
 '{"Betakaroten", "Alfa-karoten", "Lutein"}',
 '{"Förbättrar synen", "Stärker immunförsvaret", "Hjälper hjärtat", "Skyddar mot cancer"}'
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_nutrition_data_crop_name ON nutrition_data(crop_name);

-- RLS policy
ALTER TABLE nutrition_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read nutrition data" ON nutrition_data FOR SELECT USING (true);
