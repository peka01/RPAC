/**
 * Types for SMHI Weather and Warning APIs
 */

export interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: string;
  forecast: string;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  lastUpdated: string;
  
  // Location info for display
  _postalCode?: string;
  _city?: string;
  _county?: string;
}

export interface WeatherForecast {
  date: string;
  temperature: {
    min: number;
    max: number;
  };
  weather: string;
  rainfall: number;
  windSpeed: number;
  minTempTime?: string;
  maxTempTime?: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  rainfall: number;
  weather: string;
  windSpeed: number;
}

/**
 * SMHI Official Warning System Types
 */

export type SMHIWarningSeverity = 1 | 2 | 3 | 4; // Class 1-3, 4 for updates/notices

export interface SMHIWarningArea {
  name: string;
  type: 'County' | 'Municipality' | 'Lake' | 'Coastal' | 'Mountain';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface SMHIWarningType {
  name: string;
  category: 
    | 'wind' 
    | 'snow' 
    | 'rain' 
    | 'thunder' 
    | 'icing' 
    | 'flooding' 
    | 'landslide'
    | 'forest-fire'
    | 'high-temperature'
    | 'grass-fire'
    | 'water-level';
  severity: SMHIWarningSeverity;
}

export interface SMHIWarning {
  id: number;
  normalProbability: boolean;
  event: {
    sv: string;
    en: string;
    code: string;
    mhoClassification: {
      sv: string;
      en: string;
      code: string;
    };
  };
  descriptions: any[];
  warningAreas: Array<{
    id: number;
    approximateStart: string;
    approximateEnd?: string;
    published: string;
    normalProbability: boolean;
    pushNotice: boolean;
    areaName: string | { sv: string };
    warningLevel: string | { sv: string; en: string; code: string };
    eventDescription: string | { sv: string; en: string; code: string };
    affectedAreas: string;
    descriptions: string;
    area: any;
    created: string;
  }>;
}

export interface SMHIWarningResponse {
  warnings: SMHIWarning[];
  metadata: {
    updated: string;
    source: string;
  };
}