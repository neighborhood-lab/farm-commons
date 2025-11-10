// Weather API Integration Service
// Fetches weather data from OpenWeatherMap API with Redis caching

import { createClient } from 'redis';
import pino from 'pino';

const logger = pino({ name: 'weather-service' });

// Types for OpenWeatherMap API responses
export interface Coordinates {
  lat: number;
  lon: number;
}

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherCondition[];
  rain?: {
    '1h': number;
  };
  snow?: {
    '1h': number;
  };
}

export interface DailyForecast {
  dt: number;
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  moon_phase: number;
  summary: string;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  dew_point: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherCondition[];
  clouds: number;
  pop: number; // Probability of precipitation
  rain?: number;
  snow?: number;
  uvi: number;
}

export interface WeatherAlert {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

export interface WeatherData {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current?: CurrentWeather;
  daily?: DailyForecast[];
  alerts?: WeatherAlert[];
}

// Service configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/3.0/onecall';
const CACHE_TTL = 3600; // 1 hour in seconds
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis client (singleton)
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Redis client for caching
 */
async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: REDIS_URL,
    });

    redisClient.on('error', (err) => {
      logger.error({ err }, 'Redis client error');
    });

    await redisClient.connect();
    logger.info('Redis client connected for weather caching');
  }

  return redisClient;
}

/**
 * Generate cache key for weather data
 */
function getCacheKey(lat: number, lon: number, type: string): string {
  return `weather:${type}:${lat.toFixed(4)}:${lon.toFixed(4)}`;
}

/**
 * Fetch data from cache or API
 */
async function fetchWithCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  try {
    const client = await getRedisClient();
    const cached = await client.get(cacheKey);

    if (cached) {
      logger.debug({ cacheKey }, 'Cache hit for weather data');
      return JSON.parse(cached) as T;
    }

    logger.debug({ cacheKey }, 'Cache miss for weather data');
    const data = await fetchFn();

    // Cache the result
    await client.setEx(cacheKey, CACHE_TTL, JSON.stringify(data));

    return data;
  } catch (error) {
    logger.warn({ error, cacheKey }, 'Cache operation failed, fetching directly');
    // If cache fails, fetch directly
    return fetchFn();
  }
}

/**
 * Make API request to OpenWeatherMap
 */
async function fetchFromAPI(
  lat: number,
  lon: number,
  exclude?: string[]
): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OPENWEATHER_API_KEY is not configured');
  }

  const excludeParam = exclude?.join(',') || '';
  const url = new URL(OPENWEATHER_BASE_URL);
  url.searchParams.set('lat', lat.toString());
  url.searchParams.set('lon', lon.toString());
  url.searchParams.set('appid', OPENWEATHER_API_KEY);
  url.searchParams.set('units', 'imperial'); // Fahrenheit for US farms
  if (excludeParam) {
    url.searchParams.set('exclude', excludeParam);
  }

  logger.debug({ url: url.toString() }, 'Fetching weather data from API');

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(
      { status: response.status, error: errorText },
      'OpenWeatherMap API error'
    );
    throw new Error(
      `OpenWeatherMap API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data as WeatherData;
}

/**
 * Get current weather conditions for a location
 */
export async function getCurrentWeather(
  lat: number,
  lon: number
): Promise<CurrentWeather | null> {
  const cacheKey = getCacheKey(lat, lon, 'current');

  const data = await fetchWithCache(cacheKey, () =>
    fetchFromAPI(lat, lon, ['minutely', 'hourly', 'daily', 'alerts'])
  );

  return data.current || null;
}

/**
 * Get 7-day weather forecast for a location
 */
export async function getWeatherForecast(
  lat: number,
  lon: number,
  days: number = 7
): Promise<DailyForecast[]> {
  const cacheKey = getCacheKey(lat, lon, 'forecast');

  const data = await fetchWithCache(cacheKey, () =>
    fetchFromAPI(lat, lon, ['minutely', 'hourly', 'current', 'alerts'])
  );

  const forecast = data.daily || [];
  // Limit to requested number of days (max 8 from API)
  return forecast.slice(0, Math.min(days, 8));
}

/**
 * Get weather alerts for a location
 */
export async function getWeatherAlerts(
  lat: number,
  lon: number
): Promise<WeatherAlert[]> {
  const cacheKey = getCacheKey(lat, lon, 'alerts');

  const data = await fetchWithCache(cacheKey, () =>
    fetchFromAPI(lat, lon, ['minutely', 'hourly', 'daily', 'current'])
  );

  return data.alerts || [];
}

/**
 * Get comprehensive weather data (current + forecast + alerts)
 */
export async function getCompleteWeather(
  lat: number,
  lon: number
): Promise<{
  current: CurrentWeather | null;
  forecast: DailyForecast[];
  alerts: WeatherAlert[];
}> {
  const cacheKey = getCacheKey(lat, lon, 'complete');

  const data = await fetchWithCache(cacheKey, () =>
    fetchFromAPI(lat, lon, ['minutely', 'hourly'])
  );

  return {
    current: data.current || null,
    forecast: (data.daily || []).slice(0, 7),
    alerts: data.alerts || [],
  };
}

/**
 * Clear weather cache for a location
 */
export async function clearWeatherCache(lat: number, lon: number): Promise<void> {
  try {
    const client = await getRedisClient();
    const keys = [
      getCacheKey(lat, lon, 'current'),
      getCacheKey(lat, lon, 'forecast'),
      getCacheKey(lat, lon, 'alerts'),
      getCacheKey(lat, lon, 'complete'),
    ];

    await Promise.all(keys.map((key) => client.del(key)));
    logger.info({ lat, lon }, 'Cleared weather cache');
  } catch (error) {
    logger.error({ error, lat, lon }, 'Failed to clear weather cache');
  }
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeWeatherService(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Weather service Redis connection closed');
  }
}
