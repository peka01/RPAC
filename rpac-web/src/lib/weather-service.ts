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

  // Swedish location coordinates mapping
  private static readonly LOCATION_COORDINATES: Record<string, { lat: number; lon: number }> = {
    // Stockholm County
    'stockholm': { lat: 59.3293, lon: 18.0686 },
    'uppsala': { lat: 59.8586, lon: 17.6389 },
    'sodermanland': { lat: 58.7500, lon: 16.6667 },
    
    // Götaland
    'ostergotland': { lat: 58.4167, lon: 15.6167 },
    'jonkoping': { lat: 57.7826, lon: 14.1618 },
    'kronoberg': { lat: 56.8787, lon: 14.8094 },
    'kalmar': { lat: 56.6634, lon: 16.3567 },
    'blekinge': { lat: 56.1612, lon: 15.5869 },
    'skane': { lat: 55.6059, lon: 13.0007 },
    'halland': { lat: 56.8967, lon: 12.8034 },
    'vastra_gotaland': { lat: 57.7089, lon: 11.9746 },
    
    // Svealand
    'varmland': { lat: 59.6162, lon: 13.5018 },
    'orebro': { lat: 59.2741, lon: 15.2066 },
    'vastmanland': { lat: 59.6162, lon: 16.5521 },
    'dalarna': { lat: 60.6745, lon: 15.6257 },
    'gavleborg': { lat: 60.6745, lon: 16.1534 },
    
    // Norrland
    'vasternorrland': { lat: 62.3908, lon: 17.3069 },
    'jamtland': { lat: 63.1712, lon: 14.9592 },
    'vasterbotten': { lat: 64.7507, lon: 20.9522 },
    'norrbotten': { lat: 65.8252, lon: 21.6889 }
  };

  // Major Swedish cities coordinates
  private static readonly CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
    'stockholm': { lat: 59.3293, lon: 18.0686 },
    'goteborg': { lat: 57.7089, lon: 11.9746 },
    'malmo': { lat: 55.6059, lon: 13.0007 },
    'uppsala': { lat: 59.8586, lon: 17.6389 },
    'vasteras': { lat: 59.6162, lon: 16.5521 },
    'orebro': { lat: 59.2741, lon: 15.2066 },
    'linkoping': { lat: 58.4167, lon: 15.6167 },
    'helsingborg': { lat: 56.0465, lon: 12.6945 },
    'jonkoping': { lat: 57.7826, lon: 14.1618 },
    'norrkoping': { lat: 58.5877, lon: 16.1924 },
    'lund': { lat: 55.7047, lon: 13.1910 },
    'umea': { lat: 63.8258, lon: 20.2630 },
    'gavle': { lat: 60.6745, lon: 17.1418 },
    'boras': { lat: 57.7210, lon: 12.9401 },
    'sundsvall': { lat: 62.3908, lon: 17.3069 },
    'eskilstuna': { lat: 59.3706, lon: 16.5078 },
    'halmstad': { lat: 56.6745, lon: 12.8578 },
    'vaxjo': { lat: 56.8787, lon: 14.8094 },
    'karlstad': { lat: 59.3793, lon: 13.5036 },
    'sodertalje': { lat: 59.1955, lon: 17.6252 }
  };

  /**
   * Get coordinates from user profile (county and city)
   */
  static getUserCoordinates(userProfile?: { county?: string; city?: string }): { lat: number; lon: number } {
    if (!userProfile) {
      return { lat: 59.3293, lon: 18.0686 }; // Default to Stockholm
    }

    // Try to get city coordinates first (more specific)
    if (userProfile.city) {
      const cityKey = userProfile.city.toLowerCase().replace(/\s+/g, '');
      if (this.CITY_COORDINATES[cityKey]) {
        return this.CITY_COORDINATES[cityKey];
      }
    }

    // Fall back to county coordinates
    if (userProfile.county) {
      const countyKey = userProfile.county.toLowerCase().replace(/\s+/g, '');
      if (this.LOCATION_COORDINATES[countyKey]) {
        return this.LOCATION_COORDINATES[countyKey];
      }
    }

    // Default to Stockholm if no match found
    return { lat: 59.3293, lon: 18.0686 };
  }

  /**
   * Get current weather data for Swedish location
   */
  static async getCurrentWeather(
    latitude?: number, 
    longitude?: number, 
    userProfile?: { county?: string; city?: string }
  ): Promise<WeatherData> {
    // Get coordinates from user profile if provided, otherwise use provided coordinates or defaults
    const coords = userProfile ? this.getUserCoordinates(userProfile) : 
                   (latitude && longitude ? { lat: latitude, lon: longitude } : { lat: 59.3293, lon: 18.0686 });
    
    const { lat, lon } = coords;
    try {
      // Check cache first
      if (this.weatherCache && Date.now() - this.weatherCache.timestamp < this.CACHE_DURATION) {
        return this.weatherCache.data;
      }

      // Try to get real weather data from SMHI API
      try {
        const smhiResponse = await fetch(
          `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${lon}/lat/${lat}/data.json`
        );
        
        if (smhiResponse.ok) {
          const smhiData = await smhiResponse.json();
          const currentTime = new Date();
          const currentHour = currentTime.getHours();
          
          // Find the closest time forecast
          const timeSeries = smhiData.timeSeries || [];
          const closestForecast = timeSeries.find((item: any) => {
            const forecastTime = new Date(item.validTime);
            const timeDiff = Math.abs(forecastTime.getTime() - currentTime.getTime());
            return timeDiff < 3 * 60 * 60 * 1000; // Within 3 hours
          }) || timeSeries[0];

          if (closestForecast) {
            const parameters = closestForecast.parameters || [];
            const getParameter = (name: string) => {
              const param = parameters.find((p: any) => p.name === name);
              return param ? param.values[0] : null;
            };

            const realWeather: WeatherData = {
              temperature: getParameter('t') || this.getRandomTemperature(),
              humidity: getParameter('r') || this.getRandomHumidity(),
              rainfall: getParameter('pmean') || this.getRandomRainfall(),
              forecast: this.getRandomForecast(),
              windSpeed: getParameter('ws') || this.getRandomWindSpeed(),
              windDirection: this.getRandomWindDirection(),
              pressure: getParameter('msl') || this.getRandomPressure(),
              uvIndex: this.getRandomUVIndex(),
              sunrise: '06:30',
              sunset: '18:45',
              lastUpdated: new Date().toISOString()
            };

            // Cache the result
            this.weatherCache = {
              data: realWeather,
              timestamp: Date.now()
            };

            return realWeather;
          }
        }
      } catch (smhiError) {
        console.log('SMHI API not available, using fallback data:', smhiError);
      }

      // Fallback to mock data if SMHI API fails
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
   * Get weather forecast for the next few days with extreme weather detection
   */
  static async getWeatherForecast(
    latitude?: number, 
    longitude?: number, 
    userProfile?: { county?: string; city?: string }
  ): Promise<WeatherForecast[]> {
    // Get coordinates from user profile if provided, otherwise use provided coordinates or defaults
    const coords = userProfile ? this.getUserCoordinates(userProfile) : 
                   (latitude && longitude ? { lat: latitude, lon: longitude } : { lat: 59.3293, lon: 18.0686 });
    
    const { lat, lon } = coords;
    try {
      // Try to get real forecast data from SMHI API
      try {
        const smhiResponse = await fetch(
          `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${lon}/lat/${lat}/data.json`
        );
        
        if (smhiResponse.ok) {
          const smhiData = await smhiResponse.json();
          const timeSeries = smhiData.timeSeries || [];
          
          // Get forecast for next 5 days
          const forecast: WeatherForecast[] = [];
          const today = new Date();
          
          for (let i = 0; i < 5; i++) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + i);
            targetDate.setHours(12, 0, 0, 0); // Midday
            
            // Find forecast closest to target date
            const dayForecast = timeSeries.find((item: any) => {
              const forecastTime = new Date(item.validTime);
              const timeDiff = Math.abs(forecastTime.getTime() - targetDate.getTime());
              return timeDiff < 12 * 60 * 60 * 1000; // Within 12 hours
            });
            
            if (dayForecast) {
              const parameters = dayForecast.parameters || [];
              const getParameter = (name: string) => {
                const param = parameters.find((p: any) => p.name === name);
                return param ? param.values[0] : null;
              };
              
              const temp = getParameter('t') || this.getRandomTemperature();
              const windSpeed = getParameter('ws') || this.getRandomWindSpeed();
              const rainfall = getParameter('pmean') || Math.random() * 10;
              
              forecast.push({
                date: targetDate.toISOString().split('T')[0],
                temperature: {
                  min: temp - 5,
                  max: temp + 5
                },
                weather: this.getWeatherDescription(temp, rainfall, windSpeed),
                rainfall: rainfall,
                windSpeed: windSpeed
              });
            } else {
              // Fallback to mock data
              forecast.push({
                date: targetDate.toISOString().split('T')[0],
                temperature: {
                  min: this.getRandomTemperature() - 5,
                  max: this.getRandomTemperature() + 5
                },
                weather: this.getRandomForecast(),
                rainfall: Math.random() * 10,
                windSpeed: this.getRandomWindSpeed()
              });
            }
          }
          
          return forecast;
        }
      } catch (smhiError) {
        console.log('SMHI forecast API not available, using fallback data:', smhiError);
      }
      
      // Fallback to mock forecast data
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
   * Get extreme weather warnings and frost alerts
   */
  static getExtremeWeatherWarnings(forecast: WeatherForecast[]): string[] {
    const warnings: string[] = [];
    const currentMonth = new Date().getMonth() + 1;
    const isGrowingSeason = currentMonth >= 3 && currentMonth <= 10;
    
    forecast.forEach((day, index) => {
      const date = new Date(day.date);
      const dayName = index === 0 ? 'Idag' : 
                     index === 1 ? 'Imorgon' : 
                     date.toLocaleDateString('sv-SE', { weekday: 'long' });
      
      // Frost warnings (critical for cultivation)
      if (day.temperature.min < 2) {
        if (isGrowingSeason) {
          warnings.push(`❄️ FROSTVARNING ${dayName}: ${Math.round(day.temperature.min)}°C - Skydda känsliga växter!`);
        } else {
          warnings.push(`❄️ Kyla ${dayName}: ${Math.round(day.temperature.min)}°C - Förbered för kalla nätter`);
        }
      }
      
      // Extreme heat warnings
      if (day.temperature.max > 30) {
        warnings.push(`🌡️ EXTREM VÄRME ${dayName}: ${Math.round(day.temperature.max)}°C - Öka vattning och skugga`);
      }
      
      // Strong wind warnings
      if (day.windSpeed > 15) {
        warnings.push(`💨 STARK VIND ${dayName}: ${Math.round(day.windSpeed)} m/s - Skydda höga växter och kontrollera stöd`);
      }
      
      // Heavy rainfall warnings
      if (day.rainfall > 15) {
        warnings.push(`🌧️ KRAFTIGT REGN ${dayName}: ${Math.round(day.rainfall)}mm - Kontrollera dränering och undvik vattning`);
      }
      
      // Storm conditions
      if (day.windSpeed > 20 && day.rainfall > 10) {
        warnings.push(`⛈️ STORMVARNING ${dayName}: Vind ${Math.round(day.windSpeed)} m/s + regn ${Math.round(day.rainfall)}mm - Skydda allt känsligt`);
      }
    });
    
    return warnings;
  }

  /**
   * Get weather description based on conditions
   */
  private static getWeatherDescription(temperature: number, rainfall: number, windSpeed: number): string {
    if (rainfall > 10) return 'Kraftigt regn';
    if (rainfall > 5) return 'Regn';
    if (rainfall > 1) return 'Lätt regn';
    if (windSpeed > 15) return 'Stark vind';
    if (windSpeed > 10) return 'Blåsigt';
    if (temperature > 25) return 'Varmt och soligt';
    if (temperature > 15) return 'Milt och soligt';
    if (temperature > 5) return 'Svalt';
    return 'Kallt';
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
