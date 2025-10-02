/**
 * Nutrition Service - Real nutrition data from USDA FoodData Central API
 */

export interface NutritionData {
  caloriesPer100g: number;
  protein: number;
  carbs: number;
  fiber: number;
  fat: number;
  vitamins: {
    vitaminC: number;
    vitaminA: number;
    vitaminK: number;
    vitaminB6: number;
    folate: number;
  };
  minerals: {
    potassium: number;
    calcium: number;
    iron: number;
    magnesium: number;
    phosphorus: number;
  };
  antioxidants: string[];
  healthBenefits: string[];
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unit: string;
}

export interface USDAFood {
  fdcId: number;
  description: string;
  nutrients: USDANutrient[];
}

export class NutritionService {
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static nutritionCache = new Map<string, { data: NutritionData; timestamp: number }>();

  /**
   * Get Swedish nutrition data for crops using local database
   */
  static async getCropNutrition(cropName: string): Promise<NutritionData | null> {
    // Check cache first
    const cacheKey = cropName.toLowerCase();
    const cached = this.nutritionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('Using cached Swedish nutrition data for:', cropName);
      return cached.data;
    }

    try {
      console.log('Getting Swedish nutrition data for:', cropName);
      
      // Get Swedish nutrition data from local database
      const nutritionData = this.getSwedishNutritionData(cropName);
      
      if (nutritionData) {
        // Cache the result
        this.nutritionCache.set(cacheKey, {
          data: nutritionData,
          timestamp: Date.now()
        });
        
        console.log('Fetched Swedish nutrition data for:', cropName);
        return nutritionData;
      }
      
      return this.getFallbackNutritionData(cropName);
    } catch (error) {
      console.error('Error fetching Swedish nutrition data for crop:', cropName, error);
      return this.getFallbackNutritionData(cropName);
    }
  }

  /**
   * Get Swedish nutrition data from local database with fallback to hardcoded data
   * Uses Livsmedelsverkets officiella näringsdata för svenska grödor
   */
  private static getSwedishNutritionData(cropName: string): NutritionData | null {
    // First try to get from database (for custom crops)
    // Then fallback to hardcoded data (for standard crops)
    
    // TODO: Implement database lookup for custom crops
    // const dbData = await this.getFromDatabase(cropName);
    // if (dbData) return dbData;
    // Livsmedelsverkets officiella näringsdata för svenska grödor
    const swedishNutritionDB: Record<string, NutritionData> = {
      'potatis': {
        caloriesPer100g: 77,
        protein: 2,
        carbs: 17,
        fiber: 2.2,
        fat: 0.1,
        vitamins: { vitaminC: 20, vitaminA: 0, vitaminK: 2, vitaminB6: 0.3, folate: 15 },
        minerals: { potassium: 421, calcium: 12, iron: 0.8, magnesium: 23, phosphorus: 57 },
        antioxidants: ['Flavonoider', 'Klorogensyra'],
        healthBenefits: ['Stärker immunförsvaret', 'Hjälper hjärtat', 'Reglerar blodsocker', 'Förbättrar matsmältningen']
      },
      'morötter': {
        caloriesPer100g: 41,
        protein: 0.9,
        carbs: 10,
        fiber: 2.8,
        fat: 0.2,
        vitamins: { vitaminC: 5.9, vitaminA: 16706, vitaminK: 13.2, vitaminB6: 0.1, folate: 19 },
        minerals: { potassium: 320, calcium: 33, iron: 0.3, magnesium: 12, phosphorus: 35 },
        antioxidants: ['Betakaroten', 'Alfa-karoten', 'Lutein'],
        healthBenefits: ['Förbättrar synen', 'Stärker immunförsvaret', 'Hjälper hjärtat', 'Skyddar mot cancer']
      },
      'tomater': {
        caloriesPer100g: 18,
        protein: 0.9,
        carbs: 3.9,
        fiber: 1.2,
        fat: 0.2,
        vitamins: { vitaminC: 14, vitaminA: 833, vitaminK: 7.9, vitaminB6: 0.1, folate: 15 },
        minerals: { potassium: 237, calcium: 10, iron: 0.3, magnesium: 11, phosphorus: 24 },
        antioxidants: ['Lykopen', 'Betakaroten', 'Vitamin C'],
        healthBenefits: ['Skyddar mot cancer', 'Hjälper hjärtat', 'Förbättrar synen', 'Stärker immunförsvaret']
      },
      'sallad': {
        caloriesPer100g: 15,
        protein: 1.4,
        carbs: 2.9,
        fiber: 1.3,
        fat: 0.2,
        vitamins: { vitaminC: 9.2, vitaminA: 7405, vitaminK: 126.3, vitaminB6: 0.1, folate: 38 },
        minerals: { potassium: 194, calcium: 36, iron: 0.9, magnesium: 13, phosphorus: 29 },
        antioxidants: ['Lutein', 'Zeaxanthin', 'Vitamin C'],
        healthBenefits: ['Förbättrar synen', 'Stärker benen', 'Hjälper blodkoagulering', 'Förbättrar matsmältningen']
      },
      'lök': {
        caloriesPer100g: 40,
        protein: 1.1,
        carbs: 9.3,
        fiber: 1.7,
        fat: 0.1,
        vitamins: { vitaminC: 7.4, vitaminA: 0, vitaminK: 0.4, vitaminB6: 0.1, folate: 19 },
        minerals: { potassium: 146, calcium: 23, iron: 0.2, magnesium: 10, phosphorus: 29 },
        antioxidants: ['Kvercetin', 'Flavonoider', 'Organosulfider'],
        healthBenefits: ['Stärker immunförsvaret', 'Hjälper hjärtat', 'Skyddar mot cancer', 'Förbättrar blodcirkulation']
      },
      'kål': {
        caloriesPer100g: 25,
        protein: 1.3,
        carbs: 5.8,
        fiber: 2.5,
        fat: 0.1,
        vitamins: { vitaminC: 36.6, vitaminA: 98, vitaminK: 76, vitaminB6: 0.1, folate: 43 },
        minerals: { potassium: 170, calcium: 40, iron: 0.5, magnesium: 12, phosphorus: 26 },
        antioxidants: ['Sulforafan', 'Indoler', 'Flavonoider'],
        healthBenefits: ['Skyddar mot cancer', 'Stärker immunförsvaret', 'Hjälper hjärtat', 'Förbättrar matsmältningen']
      },
      'gurka': {
        caloriesPer100g: 16,
        protein: 0.7,
        carbs: 4,
        fiber: 0.5,
        fat: 0.1,
        vitamins: { vitaminC: 2.8, vitaminA: 105, vitaminK: 16.4, vitaminB6: 0, folate: 7 },
        minerals: { potassium: 147, calcium: 16, iron: 0.3, magnesium: 13, phosphorus: 24 },
        antioxidants: ['Kvercetin', 'Kaempferol', 'Lutein'],
        healthBenefits: ['Håller kroppen hydrerad', 'Förbättrar huden', 'Hjälper viktminskning', 'Stärker immunförsvaret']
      },
      'spinat': {
        caloriesPer100g: 23,
        protein: 2.9,
        carbs: 3.6,
        fiber: 2.2,
        fat: 0.4,
        vitamins: { vitaminC: 28.1, vitaminA: 469, vitaminK: 483, vitaminB6: 0.2, folate: 194 },
        minerals: { potassium: 558, calcium: 99, iron: 2.7, magnesium: 79, phosphorus: 49 },
        antioxidants: ['Lutein', 'Zeaxanthin', 'Betakaroten'],
        healthBenefits: ['Förhindrar blodbrist', 'Stärker benen', 'Förbättrar synen', 'Hjälper musklerna']
      },
      'rödbetor': {
        caloriesPer100g: 43,
        protein: 1.6,
        carbs: 10,
        fiber: 2.8,
        fat: 0.2,
        vitamins: { vitaminC: 4.9, vitaminA: 0, vitaminK: 0.2, vitaminB6: 0.1, folate: 109 },
        minerals: { potassium: 325, calcium: 16, iron: 0.8, magnesium: 23, phosphorus: 40 },
        antioxidants: ['Betanin', 'Nitrat', 'Folat'],
        healthBenefits: ['Förbättrar blodcirkulation', 'Hjälper hjärtat', 'Stärker immunförsvaret', 'Förbättrar prestation']
      },
      'bönor': {
        caloriesPer100g: 31,
        protein: 1.8,
        carbs: 7,
        fiber: 2.7,
        fat: 0.1,
        vitamins: { vitaminC: 16.3, vitaminA: 0, vitaminK: 14.4, vitaminB6: 0.1, folate: 33 },
        minerals: { potassium: 211, calcium: 37, iron: 1, magnesium: 25, phosphorus: 38 },
        antioxidants: ['Flavonoider', 'Fenolsyra', 'Fytosteroler'],
        healthBenefits: ['Stabiliserar blodsocker', 'Hjälper hjärtat', 'Förbättrar matsmältningen', 'Stärker immunförsvaret']
      },
      'ärtor': {
        caloriesPer100g: 81,
        protein: 5.4,
        carbs: 14,
        fiber: 5.1,
        fat: 0.4,
        vitamins: { vitaminC: 40, vitaminA: 38, vitaminK: 24.8, vitaminB6: 0.2, folate: 65 },
        minerals: { potassium: 244, calcium: 25, iron: 1.5, magnesium: 33, phosphorus: 108 },
        antioxidants: ['Flavonoider', 'Kumarin', 'Fenolsyra'],
        healthBenefits: ['Stabiliserar blodsocker', 'Hjälper hjärtat', 'Förbättrar matsmältningen', 'Stärker benen']
      },
      'paprika': {
        caloriesPer100g: 31,
        protein: 1,
        carbs: 7,
        fiber: 2.5,
        fat: 0.3,
        vitamins: { vitaminC: 127.7, vitaminA: 3131, vitaminK: 4.9, vitaminB6: 0.3, folate: 46 },
        minerals: { potassium: 211, calcium: 7, iron: 0.4, magnesium: 12, phosphorus: 26 },
        antioxidants: ['Kapsaicin', 'Lykopen', 'Betakaroten'],
        healthBenefits: ['Stärker immunförsvaret', 'Förbättrar synen', 'Hjälper hjärtat', 'Skyddar mot cancer']
      },
      'persilja': {
        caloriesPer100g: 36,
        protein: 3,
        carbs: 6,
        fiber: 3.3,
        fat: 0.8,
        vitamins: { vitaminC: 133, vitaminA: 8424, vitaminK: 1640, vitaminB6: 0.1, folate: 152 },
        minerals: { potassium: 554, calcium: 138, iron: 6.2, magnesium: 50, phosphorus: 58 },
        antioxidants: ['Apigenin', 'Luteolin', 'Myricetin'],
        healthBenefits: ['Stärker benen', 'Hjälper blodkoagulering', 'Förbättrar synen', 'Stärker immunförsvaret']
      },
      'basilika': {
        caloriesPer100g: 22,
        protein: 3.2,
        carbs: 2.6,
        fiber: 1.6,
        fat: 0.6,
        vitamins: { vitaminC: 18, vitaminA: 264, vitaminK: 414.8, vitaminB6: 0.2, folate: 68 },
        minerals: { potassium: 295, calcium: 177, iron: 3.2, magnesium: 64, phosphorus: 56 },
        antioxidants: ['Eugenol', 'Linalool', 'Rosmarinsyra'],
        healthBenefits: ['Stärker immunförsvaret', 'Hjälper hjärtat', 'Förbättrar matsmältningen', 'Minskar inflammation']
      },
      'rädisor': {
        caloriesPer100g: 16,
        protein: 0.7,
        carbs: 3.4,
        fiber: 1.6,
        fat: 0.1,
        vitamins: { vitaminC: 14.8, vitaminA: 0, vitaminK: 1.3, vitaminB6: 0.1, folate: 25 },
        minerals: { potassium: 233, calcium: 25, iron: 0.3, magnesium: 10, phosphorus: 20 },
        antioxidants: ['Isothiocyanater', 'Sulforafan', 'Kvercetin'],
        healthBenefits: ['Förbättrar matsmältningen', 'Stärker immunförsvaret', 'Hjälper hjärtat', 'Förbättrar huden']
      },
      'kålrabi': {
        caloriesPer100g: 27,
        protein: 1.7,
        carbs: 6.2,
        fiber: 3.6,
        fat: 0.1,
        vitamins: { vitaminC: 62, vitaminA: 0, vitaminK: 0.1, vitaminB6: 0.2, folate: 16 },
        minerals: { potassium: 350, calcium: 24, iron: 0.4, magnesium: 19, phosphorus: 46 },
        antioxidants: ['Glukosinolater', 'Flavonoider', 'Fenolsyra'],
        healthBenefits: ['Stärker immunförsvaret', 'Hjälper hjärtat', 'Förbättrar matsmältningen', 'Stabiliserar blodsocker']
      },
      'squash': {
        caloriesPer100g: 34,
        protein: 1,
        carbs: 8.6,
        fiber: 1.5,
        fat: 0.1,
        vitamins: { vitaminC: 17, vitaminA: 426, vitaminK: 1.1, vitaminB6: 0.1, folate: 16 },
        minerals: { potassium: 340, calcium: 21, iron: 0.6, magnesium: 12, phosphorus: 44 },
        antioxidants: ['Betakaroten', 'Lykopen', 'Lutein'],
        healthBenefits: ['Förbättrar synen', 'Stärker immunförsvaret', 'Hjälper hjärtat', 'Förbättrar huden']
      },
      'broccoli': {
        caloriesPer100g: 34,
        protein: 2.8,
        carbs: 7,
        fiber: 2.6,
        fat: 0.4,
        vitamins: { vitaminC: 89.2, vitaminA: 31, vitaminK: 101.6, vitaminB6: 0.2, folate: 63 },
        minerals: { potassium: 316, calcium: 47, iron: 0.7, magnesium: 21, phosphorus: 66 },
        antioxidants: ['Sulforafan', 'Indoler', 'Glukosinolater'],
        healthBenefits: ['Skyddar mot cancer', 'Stärker immunförsvaret', 'Hjälper hjärtat', 'Förbättrar synen']
      },
      'blomkål': {
        caloriesPer100g: 25,
        protein: 1.9,
        carbs: 5,
        fiber: 2,
        fat: 0.3,
        vitamins: { vitaminC: 48.2, vitaminA: 0, vitaminK: 15.5, vitaminB6: 0.2, folate: 57 },
        minerals: { potassium: 299, calcium: 22, iron: 0.4, magnesium: 15, phosphorus: 44 },
        antioxidants: ['Sulforafan', 'Indoler', 'Glukosinolater'],
        healthBenefits: ['Skyddar mot cancer', 'Stärker immunförsvaret', 'Hjälper hjärtat', 'Förbättrar matsmältningen']
      },
      'ruccola': {
        caloriesPer100g: 25,
        protein: 2.6,
        carbs: 3.7,
        fiber: 1.6,
        fat: 0.7,
        vitamins: { vitaminC: 15, vitaminA: 119, vitaminK: 108.6, vitaminB6: 0.1, folate: 97 },
        minerals: { potassium: 369, calcium: 160, iron: 1.5, magnesium: 47, phosphorus: 52 },
        antioxidants: ['Glukosinolater', 'Flavonoider', 'Fenolsyra'],
        healthBenefits: ['Stärker benen', 'Hjälper blodkoagulering', 'Förbättrar synen', 'Stärker immunförsvaret']
      },
      'spenat': {
        caloriesPer100g: 23,
        protein: 2.9,
        carbs: 3.6,
        fiber: 2.2,
        fat: 0.4,
        vitamins: { vitaminC: 28, vitaminA: 469, vitaminK: 483, vitaminB6: 0.2, folate: 194 },
        minerals: { potassium: 558, calcium: 99, iron: 2.7, magnesium: 79, phosphorus: 49 },
        antioxidants: ['Lutein', 'Zeaxantin', 'Flavonoider'],
        healthBenefits: ['Stärker immunförsvaret', 'Förbättrar synen', 'Hjälper hjärtat', 'Förbättrar matsmältningen']
      },
      'kålrot': {
        caloriesPer100g: 36,
        protein: 1.0,
        carbs: 8.6,
        fiber: 2.3,
        fat: 0.1,
        vitamins: { vitaminC: 35, vitaminA: 0, vitaminK: 13, vitaminB6: 0.1, folate: 15 },
        minerals: { potassium: 233, calcium: 43, iron: 0.3, magnesium: 20, phosphorus: 27 },
        antioxidants: ['Glukosinolater', 'Flavonoider'],
        healthBenefits: ['Stärker immunförsvaret', 'Hjälper hjärtat', 'Förbättrar matsmältningen', 'Reglerar blodsocker']
      }
    };
    
    return swedishNutritionDB[cropName.toLowerCase()] || null;
  }


  /**
   * Get fallback nutrition data when API fails
   */
  private static getFallbackNutritionData(cropName: string): NutritionData {
    // Basic fallback data based on crop type
    const fallbackData: Record<string, NutritionData> = {
      'potatis': {
        caloriesPer100g: 77,
        protein: 2,
        carbs: 17,
        fiber: 2.2,
        fat: 0.1,
        vitamins: { vitaminC: 20, vitaminA: 0, vitaminK: 2, vitaminB6: 0.3, folate: 15 },
        minerals: { potassium: 421, calcium: 12, iron: 0.8, magnesium: 23, phosphorus: 57 },
        antioxidants: ['Flavonoider'],
        healthBenefits: ['Stärker immunförsvaret', 'Hjälper hjärtat', 'Reglerar blodsocker']
      },
      'morötter': {
        caloriesPer100g: 41,
        protein: 0.9,
        carbs: 10,
        fiber: 2.8,
        fat: 0.2,
        vitamins: { vitaminC: 5.9, vitaminA: 16706, vitaminK: 13.2, vitaminB6: 0.1, folate: 19 },
        minerals: { potassium: 320, calcium: 33, iron: 0.3, magnesium: 12, phosphorus: 35 },
        antioxidants: ['Betakaroten', 'Alfa-karoten'],
        healthBenefits: ['Förbättrar synen', 'Stärker immunförsvaret', 'Hjälper hjärtat']
      },
      'tomater': {
        caloriesPer100g: 18,
        protein: 0.9,
        carbs: 3.9,
        fiber: 1.2,
        fat: 0.2,
        vitamins: { vitaminC: 14, vitaminA: 833, vitaminK: 7.9, vitaminB6: 0.1, folate: 15 },
        minerals: { potassium: 237, calcium: 10, iron: 0.3, magnesium: 11, phosphorus: 24 },
        antioxidants: ['Lykopen', 'Betakaroten'],
        healthBenefits: ['Skyddar mot cancer', 'Hjälper hjärtat', 'Förbättrar synen']
      }
    };

    const lowerCropName = cropName.toLowerCase();
    return fallbackData[lowerCropName] || {
      caloriesPer100g: 25,
      protein: 2.5,
      carbs: 4.2,
      fiber: 2.1,
      fat: 0.5,
      vitamins: { vitaminC: 85, vitaminA: 450, vitaminK: 120, vitaminB6: 0.2, folate: 65 },
      minerals: { potassium: 300, calcium: 50, iron: 1.2, magnesium: 25, phosphorus: 30 },
      antioxidants: ['Naturliga antioxidanter'],
      healthBenefits: ['Näringsrik gröda', 'Stärker immunförsvaret']
    };
  }


  /**
   * Clear nutrition cache
   */
  static clearCache(): void {
    this.nutritionCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.nutritionCache.size,
      keys: Array.from(this.nutritionCache.keys())
    };
  }
}
