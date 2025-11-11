// Weather routes integration tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import weatherRoutes from '../weather.js';
import * as weatherService from '../../services/weather.js';

// Mock the weather service
vi.mock('../../services/weather.js', () => ({
  getCurrentWeather: vi.fn(),
  getWeatherForecast: vi.fn(),
  getWeatherAlerts: vi.fn(),
  getCompleteWeather: vi.fn(),
  clearWeatherCache: vi.fn(),
  closeWeatherService: vi.fn(),
}));

// Mock the database
vi.mock('../../db/connection.js', () => ({
  default: vi.fn((table: string) => {
    if (table === 'fields') {
      return {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: 'field-123',
          farm_id: 'farm-123',
          name: 'North Field',
          location_gps: { lat: 40.7128, lon: -74.106 },
        }),
      };
    }
    return {};
  }),
}));

// Mock auth middleware
vi.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-123',
      farm_id: 'farm-123',
      role: 'manager',
    };
    next();
  },
  requireRole: () => (req: any, res: any, next: any) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/weather', weatherRoutes);

describe('Weather Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/weather/current', () => {
    it('should return current weather for valid coordinates', async () => {
      const mockWeather = {
        dt: 1699632000,
        temp: 72.5,
        humidity: 65,
        weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
      };

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(mockWeather as any);

      const response = await request(app)
        .get('/api/weather/current')
        .query({ lat: 40.7128, lon: -74.106 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockWeather);
      expect(weatherService.getCurrentWeather).toHaveBeenCalledWith(40.7128, -74.106);
    });

    it('should return 400 for invalid coordinates', async () => {
      const response = await request(app)
        .get('/api/weather/current')
        .query({ lat: 'invalid', lon: -74.106 });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing coordinates', async () => {
      const response = await request(app)
        .get('/api/weather/current')
        .query({ lat: 40.7128 });

      expect(response.status).toBe(400);
    });

    it('should return 404 when weather data is not available', async () => {
      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/weather/current')
        .query({ lat: 40.7128, lon: -74.106 });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/weather/forecast', () => {
    it('should return 7-day forecast by default', async () => {
      const mockForecast = Array(7).fill({
        dt: 1699632000,
        temp: { day: 72.5, min: 58.3, max: 75.2 },
        weather: [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }],
      });

      vi.mocked(weatherService.getWeatherForecast).mockResolvedValue(mockForecast as any);

      const response = await request(app)
        .get('/api/weather/forecast')
        .query({ lat: 40.7128, lon: -74.106 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(7);
      expect(weatherService.getWeatherForecast).toHaveBeenCalledWith(40.7128, -74.106, 7);
    });

    it('should respect custom days parameter', async () => {
      const mockForecast = Array(3).fill({
        dt: 1699632000,
        temp: { day: 72.5 },
      });

      vi.mocked(weatherService.getWeatherForecast).mockResolvedValue(mockForecast as any);

      const response = await request(app)
        .get('/api/weather/forecast')
        .query({ lat: 40.7128, lon: -74.106, days: 3 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(weatherService.getWeatherForecast).toHaveBeenCalledWith(40.7128, -74.106, 3);
    });
  });

  describe('GET /api/weather/alerts', () => {
    it('should return weather alerts', async () => {
      const mockAlerts = [
        {
          sender_name: 'NWS',
          event: 'Winter Storm Warning',
          start: 1699632000,
          end: 1699675200,
          description: 'Heavy snow expected',
          tags: ['Snow'],
        },
      ];

      vi.mocked(weatherService.getWeatherAlerts).mockResolvedValue(mockAlerts as any);

      const response = await request(app)
        .get('/api/weather/alerts')
        .query({ lat: 40.7128, lon: -74.106 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].event).toBe('Winter Storm Warning');
    });

    it('should return empty array when no alerts', async () => {
      vi.mocked(weatherService.getWeatherAlerts).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/weather/alerts')
        .query({ lat: 40.7128, lon: -74.106 });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/weather/complete', () => {
    it('should return complete weather data', async () => {
      const mockComplete = {
        current: { dt: 1699632000, temp: 72.5 },
        forecast: Array(7).fill({ dt: 1699632000, temp: { day: 72.5 } }),
        alerts: [],
      };

      vi.mocked(weatherService.getCompleteWeather).mockResolvedValue(mockComplete as any);

      const response = await request(app)
        .get('/api/weather/complete')
        .query({ lat: 40.7128, lon: -74.106 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.current).toBeDefined();
      expect(response.body.data.forecast).toHaveLength(7);
      expect(response.body.data.alerts).toEqual([]);
    });
  });

  describe('GET /api/weather/field/:fieldId/current', () => {
    it('should return weather for field coordinates', async () => {
      const mockWeather = {
        dt: 1699632000,
        temp: 72.5,
        weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
      };

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(mockWeather as any);

      const response = await request(app)
        .get('/api/weather/field/field-123/current');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fieldId).toBe('field-123');
      expect(response.body.data.coordinates).toEqual({ lat: 40.7128, lon: -74.106 });
      expect(response.body.data.weather).toEqual(mockWeather);
    });
  });

  describe('GET /api/weather/field/:fieldId/forecast', () => {
    it('should return forecast for field coordinates', async () => {
      const mockForecast = Array(7).fill({ dt: 1699632000, temp: { day: 72.5 } });

      vi.mocked(weatherService.getWeatherForecast).mockResolvedValue(mockForecast as any);

      const response = await request(app)
        .get('/api/weather/field/field-123/forecast');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fieldId).toBe('field-123');
      expect(response.body.data.forecast).toHaveLength(7);
    });

    it('should respect days parameter for field forecast', async () => {
      const mockForecast = Array(3).fill({ dt: 1699632000, temp: { day: 72.5 } });

      vi.mocked(weatherService.getWeatherForecast).mockResolvedValue(mockForecast as any);

      const response = await request(app)
        .get('/api/weather/field/field-123/forecast')
        .query({ days: 3 });

      expect(response.status).toBe(200);
      expect(response.body.data.forecast).toHaveLength(3);
      expect(weatherService.getWeatherForecast).toHaveBeenCalledWith(40.7128, -74.106, 3);
    });
  });

  describe('GET /api/weather/field/:fieldId/complete', () => {
    it('should return complete weather for field', async () => {
      const mockComplete = {
        current: { dt: 1699632000, temp: 72.5 },
        forecast: Array(7).fill({ dt: 1699632000 }),
        alerts: [],
      };

      vi.mocked(weatherService.getCompleteWeather).mockResolvedValue(mockComplete as any);

      const response = await request(app)
        .get('/api/weather/field/field-123/complete');

      expect(response.status).toBe(200);
      expect(response.body.data.fieldId).toBe('field-123');
      expect(response.body.data.current).toBeDefined();
      expect(response.body.data.forecast).toHaveLength(7);
    });
  });

  describe('DELETE /api/weather/cache', () => {
    it('should clear weather cache', async () => {
      vi.mocked(weatherService.clearWeatherCache).mockResolvedValue();

      const response = await request(app)
        .delete('/api/weather/cache')
        .query({ lat: 40.7128, lon: -74.106 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Weather cache cleared successfully');
      expect(weatherService.clearWeatherCache).toHaveBeenCalledWith(40.7128, -74.106);
    });

    it('should return 400 for invalid coordinates', async () => {
      const response = await request(app)
        .delete('/api/weather/cache')
        .query({ lat: 'invalid', lon: -74.106 });

      expect(response.status).toBe(400);
    });
  });
});
