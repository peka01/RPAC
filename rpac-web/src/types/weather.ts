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
  id: string;
  type: SMHIWarningType;
  severity: SMHIWarningSeverity;
  area: SMHIWarningArea;
  startTime: string;
  endTime: string;
  issuedTime: string;
  updatedTime: string;
  description: string;
  recommendation: string;
  sourceInfo: {
    source: 'smhi.se';
    link: string;
  };
}

export interface SMHIWarningResponse {
  warnings: SMHIWarning[];
  metadata: {
    updated: string;
    source: string;
  };
}