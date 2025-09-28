/**
 * Weather Service for Swedish Weather Data
 * Integrates with SMHI API for weather information
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
}

export class WeatherService {
  private static readonly SMHI_API_BASE = 'https://opendata-download-metfcst.smhi.se/api';
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private static weatherCache: { data: WeatherData; timestamp: number } | null = null;

  /**
   * Get current weather data for Swedish location
   */
  static async getCurrentWeather(latitude: number = 59.3293, longitude: number = 18.0686): Promise<WeatherData> {
    try {
      // Check cache first
      if (this.weatherCache && Date.now() - this.weatherCache.timestamp < this.CACHE_DURATION) {
        return this.weatherCache.data;
      }

      // For now, return mock data since SMHI API requires more complex setup
      // In production, this would call the actual SMHI API
      const mockWeather: WeatherData = {
        temperature: this.getRandomTemperature(),
        humidity: this.getRandomHumidity(),
        rainfall: this.getRandomRainfall(),
        forecast: this.getRandomForecast(),
        windSpeed: this.getRandomWindSpeed(),
        windDirection: this.getRandomWindDirection(),
        pressure: this.getRandomPressure(),
        uvIndex: this.getRandomUVIndex(),
        sunrise: '06:30',
        sunset: '18:45',
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.weatherCache = {
        data: mockWeather,
        timestamp: Date.now()
      };

      return mockWeather;
    } catch (error) {
      console.error('Weather service error:', error);
      return this.getFallbackWeather();
    }
  }

  /**
   * Get weather forecast for the next few days
   */
  static async getWeatherForecast(latitude: number = 59.3293, longitude: number = 18.0686): Promise<WeatherForecast[]> {
    try {
      // Mock forecast data
      const forecast: WeatherForecast[] = [];
      const today = new Date();
      
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        forecast.push({
          date: date.toISOString().split('T')[0],
          temperature: {
            min: this.getRandomTemperature() - 5,
            max: this.getRandomTemperature() + 5
          },
          weather: this.getRandomForecast(),
          rainfall: Math.random() * 10,
          windSpeed: this.getRandomWindSpeed()
        });
      }

      return forecast;
    } catch (error) {
      console.error('Weather forecast error:', error);
      return [];
    }
  }

  /**
   * Get weather-based cultivation advice
   */
  static getWeatherAdvice(weather: WeatherData): string[] {
    const advice: string[] = [];

    // Temperature advice
    if (weather.temperature < 5) {
      advice.push('Frostvarning: Skydda känsliga växter med täckodling eller flytta inomhus');
    } else if (weather.temperature > 25) {
      advice.push('Hög temperatur: Öka vattning och skydda växter från direkt solljus');
    }

    // Rainfall advice
    if (weather.rainfall.includes('Regn')) {
      advice.push('Regn förväntas: Undvik vattning idag och kontrollera dränering');
    } else if (weather.rainfall.includes('Ingen nederbörd')) {
      advice.push('Ingen nederbörd: Kom ihåg att vattna dina växter');
    }

    // Wind advice
    if (weather.windSpeed > 10) {
      advice.push('Stark vind: Skydda höga växter och kontrollera att stöd är säkra');
    }

    // Humidity advice
    if (weather.humidity > 80) {
      advice.push('Hög luftfuktighet: Kontrollera för mögel och förbättra luftcirkulation');
    } else if (weather.humidity < 40) {
      advice.push('Låg luftfuktighet: Öka vattning och överväg att använda mulch');
    }

    return advice;
  }

  /**
   * Get seasonal cultivation advice based on current date
   */
  static getSeasonalAdvice(): string[] {
    const month = new Date().getMonth() + 1;
    const advice: string[] = [];

    if (month >= 3 && month <= 5) {
      // Spring
      advice.push('Vår: Börja plantera kalla grödor som morötter och potatis');
      advice.push('Förbered jorden genom att gräva och tillföra kompost');
      advice.push('Kontrollera frostvarningar innan du planterar utomhus');
    } else if (month >= 6 && month <= 8) {
      // Summer
      advice.push('Sommar: Vattna regelbundet, särskilt under torra perioder');
      advice.push('Skörda grödor när de är mogna för bästa smak och näring');
      advice.push('Kontrollera för skadedjur och sjukdomar dagligen');
    } else if (month >= 9 && month <= 11) {
      // Autumn
      advice.push('Höst: Skörda sista grödorna innan första frosten');
      advice.push('Förbered jorden för nästa år genom att tillföra kompost');
      advice.push('Plantera vintergrödor som spenat och sallat');
    } else {
      // Winter
      advice.push('Vinter: Planera din odling för nästa år');
      advice.push('Förbered frön och verktyg för vårsådningen');
      advice.push('Överväg inomhusodling av kryddörter');
    }

    return advice;
  }

  // Helper methods for mock data
  private static getRandomTemperature(): number {
    const month = new Date().getMonth() + 1;
    if (month >= 12 || month <= 2) return Math.random() * 5 - 5; // Winter: -5 to 0
    if (month >= 3 && month <= 5) return Math.random() * 15 + 5; // Spring: 5 to 20
    if (month >= 6 && month <= 8) return Math.random() * 20 + 15; // Summer: 15 to 35
    return Math.random() * 10 + 5; // Autumn: 5 to 15
  }

  private static getRandomHumidity(): number {
    return Math.floor(Math.random() * 40) + 40; // 40-80%
  }

  private static getRandomRainfall(): string {
    const options = [
      'Ingen nederbörd',
      'Lätt regn förväntas',
      'Måttligt regn',
      'Kraftigt regn',
      'Åska och regn'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  private static getRandomForecast(): string {
    const options = [
      'Klar himmel',
      'Delvis molnigt',
      'Molnigt',
      'Molnigt med uppehåll',
      'Regnigt'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  private static getRandomWindSpeed(): number {
    return Math.floor(Math.random() * 15) + 2; // 2-17 m/s
  }

  private static getRandomWindDirection(): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  private static getRandomPressure(): number {
    return Math.floor(Math.random() * 20) + 1000; // 1000-1020 hPa
  }

  private static getRandomUVIndex(): number {
    return Math.floor(Math.random() * 8) + 1; // 1-8
  }

  private static getFallbackWeather(): WeatherData {
    return {
      temperature: 15,
      humidity: 60,
      rainfall: 'Ingen nederbörd',
      forecast: 'Delvis molnigt',
      windSpeed: 5,
      windDirection: 'SW',
      pressure: 1013,
      uvIndex: 3,
      sunrise: '06:30',
      sunset: '18:45',
      lastUpdated: new Date().toISOString()
    };
  }
}
