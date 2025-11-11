// Weather service unit tests with mocked API responses

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as weatherService from '../weather.js';
import type { WeatherData, CurrentWeather, DailyForecast, WeatherAlert } from '../weather.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Mock Redis client
const mockRedis = {
  get: vi.fn(),
  setEx: vi.fn(),
  del: vi.fn(),
  quit: vi.fn(),
  connect: vi.fn(),
  on: vi.fn(),
};

// Mock the Redis client creation
vi.mock('redis', () => ({
  createClient: vi.fn(() => mockRedis),
}));

// Mock environment variables
const originalEnv = process.env;

describe('Weather Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      OPENWEATHER_API_KEY: 'test-api-key',
      REDIS_URL: 'redis://localhost:6379',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getCurrentWeather', () => {
    const mockCurrentWeather: WeatherData = {
      lat: 40.7128,
      lon: -74.106,
      timezone: 'America/New_York',
      timezone_offset: -18_000,
      current: {
        dt: 1_699_632_000,
        sunrise: 1_699_616_400,
        sunset: 1_699_653_600,
        temp: 72.5,
        feels_like: 70.2,
        pressure: 1013,
        humidity: 65,
        dew_point: 58.3,
        uvi: 3.5,
        clouds: 20,
        visibility: 10_000,
        wind_speed: 8.5,
        wind_deg: 180,
        weather: [
          {
            id: 800,
            main: 'Clear',
            description: 'clear sky',
            icon: '01d',
          },
        ],
      },
    };

    it('should fetch current weather from API when cache is empty', async () => {
      mockRedis.connect.mockResolvedValue();
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setEx.mockResolvedValue('OK');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCurrentWeather,
      });

      const result = await weatherService.getCurrentWeather(40.7128, -74.106);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.openweathermap.org/data/3.1/onecall')
      );
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('lat=40.7128'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('lon=-74.106'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('appid=test-api-key'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('units=imperial'));
      expect(result).toEqual(mockCurrentWeather.current);
      expect(mockRedis.setEx).toHaveBeenCalled();
    });

    it('should return cached data when available', async () => {
      const cachedData = JSON.stringify(mockCurrentWeather);
      mockRedis.connect.mockResolvedValue();
      mockRedis.get.mockResolvedValue(cachedData);

      const result = await weatherService.getCurrentWeather(40.7128, -74.106);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toEqual(mockCurrentWeather.current);
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.OPENWEATHER_API_KEY;
      mockRedis.connect.mockResolvedValue();
      mockRedis.get.mockResolvedValue(null);

      await expect(weatherService.getCurrentWeather(40.7128, -74.106)).rejects.toThrow(
        'OPENWEATHER_API_KEY is not configured'
      );
    });

    it('should handle API errors gracefully', async () => {
      mockRedis.connect.mockResolvedValue();
      mockRedis.get.mockResolvedValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      });

      await expect(weatherService.getCurrentWeather(40.7128, -74.106)).rejects.toThrow(
        'OpenWeatherMap API error'
      );
    });

    it('should fetch data directly when cache fails', async () => {
      mockRedis.connect.mockRejectedValue(new Error('Redis connection failed'));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCurrentWeather,
      });

      const result = await weatherService.getCurrentWeather(40.7128, -74.106);

      expect(result).toEqual(mockCurrentWeather.current);
    });
  });

  describe('getWeatherForecast', () => {
    const mockForecastData: WeatherData = {
      lat: 40.7128,
      lon: -74.106,
      timezone: 'America/New_York',
      timezone_offset: -18_000,
      daily: [
        {
          dt: 1_699_632_000,
          sunrise: 1_699_616_400,
          sunset: 1_699_653_600,
          moonrise: 1_699_620_000,
          moonset: 1_699_657_200,
          moon_phase: 0.25,
          summary: 'Partly cloudy',
          temp: {
            day: 72.5,
            min: 58.3,
            max: 75.2,
            night: 62.1,
            eve: 68.4,
            morn: 60.5,
          },
          feels_like: {
            day: 70.2,
            night: 60.5,
            eve: 66.8,
            morn: 58.9,
          },
          pressure: 1013,
          humidity: 65,
          dew_point: 58.3,
          wind_speed: 8.5,
          wind_deg: 180,
          weather: [
            {
              id: 801,
              main: 'Clouds',
              description: 'few clouds',
              icon: '02d',
            },
          ],
          clouds: 20,
          pop: 0.1,
          uvi: 3.5,
        },
      ],
    };

    it('should fetch 7-day forecast by default', async () => {
      mockRedis.connect.mockResolvedValue();
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setEx.mockResolvedValue('OK');

      // Create 8 days of data to test the slicing
      const eightDayForecast = {
        ...mockForecastData,
        daily: Array.from({ length: 8 }).fill(mockForecastData.daily![0]),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => eightDayForecast,
      });

      const result = await weatherService.getWeatherForecast(40.7128, -74.106);

      expect(result).toHaveLength(7);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('exclude=minutely%2Chourly%2Ccurrent%2Calerts')
      );
    });

    it('should respect custom days parameter', async () => {
      mockRedis.connect.mockResolvedValue();
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setEx.mockResolvedValue('OK');

      const fiveDayForecast = {
        ...mockForecastData,
        daily: Array.from({ length: 5 }).fill(mockForecastData.daily![0]),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => fiveDayForecast,
      });

      const result = await weatherService.getWeatherForecast(40.7128, -74.106, 3);

      expect(result).toHaveLength(3);
    });

    it('should limit forecast to maximum 8 days', async () => {
      mockRedis.connect.mockResolvedValue();
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setEx.mockResolvedValue('OK');

      const eightDayForecast = {
        ...mockForecastData,
        daily: Array.from({ length: 10 }).fill(mockForecastData.daily![0]),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => eightDayForecast,
      });

      const result = await weatherService.getWeatherForecast(40.7128, -74.106, 10);

      expect(result).toHaveLength(8);
    });
  });

  describe('getWeatherAlerts', () => {
    const mockAlertsData: WeatherData = {
      lat: 40.7128,
      lon: -74.106,
      timezone: 'America/New_York',
      timezone_offset: -18_000,
      alerts: [
        {
          sender_name: 'NWS New York',
          event: 'Winter Storm Warning',
          start: 1_699_632_000,
          end: 1_699_675_200,
          description: 'Heavy snow expected. Total snow accumulations of 6 to 10 inches.',
          tags: ['Snow', 'Winter weather'],
        },
      ],
    };

    it('should fetch weather alerts', async () => {
      mockRedis.connect.mockResolvedValue();
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setEx.mockResolvedValue('OK');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlertsData,
      });

      const result = await weatherService.getWeatherAlerts(40.7128, -74.106);

      expect(result).toHaveLength(1);
      expect(result[0].event).toBe('Winter Storm Warning');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('exclude=minutely%2Chourly%2Cdaily%2Ccurrent')
      );
    });

    it('should return empty array when no alerts', async () => {
      mockRedis.connect.mockResolvedValue();
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setEx.mockResolvedValue('OK');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          lat: 40.7128,
          lon: -74.106,
          timezone: 'America/New_York',
          timezone_offset: -18_000,
        }),
      });

      const result = await weatherService.getWeatherAlerts(40.7128, -74.106);

      expect(result).toEqual([]);
    });
  });

  describe('getCompleteWeather', () => {
    const mockCompleteData: WeatherData = {
      lat: 40.7128,
      lon: -74.106,
      timezone: 'America/New_York',
      timezone_offset: -18_000,
      current: {
        dt: 1_699_632_000,
        sunrise: 1_699_616_400,
        sunset: 1_699_653_600,
        temp: 72.5,
        feels_like: 70.2,
        pressure: 1013,
        humidity: 65,
        dew_point: 58.3,
        uvi: 3.5,
        clouds: 20,
        visibility: 10_000,
        wind_speed: 8.5,
        wind_deg: 180,
        weather: [
          {
            id: 800,
            main: 'Clear',
            description: 'clear sky',
            icon: '01d',
          },
        ],
      },
      daily: Array.from({ length: 7 }).fill({
        dt: 1_699_632_000,
        sunrise: 1_699_616_400,
        sunset: 1_699_653_600,
        moonrise: 1_699_620_000,
        moonset: 1_699_657_200,
        moon_phase: 0.25,
        summary: 'Partly cloudy',
        temp: { day: 72.5, min: 58.3, max: 75.2, night: 62.1, eve: 68.4, morn: 60.5 },
        feels_like: { day: 70.2, night: 60.5, eve: 66.8, morn: 58.9 },
        pressure: 1013,
        humidity: 65,
        dew_point: 58.3,
        wind_speed: 8.5,
        wind_deg: 180,
        weather: [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }],
        clouds: 20,
        pop: 0.1,
        uvi: 3.5,
      }),
      alerts: [],
    };

    it('should fetch complete weather data', async () => {
      mockRedis.connect.mockResolvedValue();
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setEx.mockResolvedValue('OK');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCompleteData,
      });

      const result = await weatherService.getCompleteWeather(40.7128, -74.106);

      expect(result.current).toBeDefined();
      expect(result.forecast).toHaveLength(7);
      expect(result.alerts).toEqual([]);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('exclude=minutely%2Chourly'));
    });
  });

  describe('clearWeatherCache', () => {
    it('should clear all cache keys for coordinates', async () => {
      mockRedis.connect.mockResolvedValue();
      mockRedis.del.mockResolvedValue(1);

      await weatherService.clearWeatherCache(40.7128, -74.106);

      expect(mockRedis.del).toHaveBeenCalledTimes(4);
    });

    it('should handle cache clear errors gracefully', async () => {
      mockRedis.connect.mockResolvedValue();
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      // Should not throw
      await expect(weatherService.clearWeatherCache(40.7128, -74.106)).resolves.toBeUndefined();
    });
  });

  describe('closeWeatherService', () => {
    it('should close Redis connection', async () => {
      mockRedis.connect.mockResolvedValue();
      mockRedis.quit.mockResolvedValue('OK');

      // First connect by calling a function that uses Redis
      mockRedis.get.mockResolvedValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lat: 0, lon: 0, timezone: 'UTC', timezone_offset: 0 }),
      });

      await weatherService.getCurrentWeather(40.7128, -74.106);

      // Then close
      await weatherService.closeWeatherService();

      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});
