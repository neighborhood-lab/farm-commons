import { useQuery } from '@tanstack/react-query';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  CloudDrizzle,
  Wind,
  Droplets,
  AlertTriangle,
  MapPin,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { api } from '../lib/api';
import type { WeatherData } from '@farm-commons/shared';

interface WeatherWidgetProps {
  className?: string;
}

export default function WeatherWidget({ className = '' }: WeatherWidgetProps) {
  const { data: weather, isLoading, error } = useQuery({
    queryKey: ['weather'],
    queryFn: () => api.get<WeatherData>('/weather'),
    // Refetch every 30 minutes
    refetchInterval: 30 * 60 * 1000,
    // Mock data for development
    placeholderData: {
      current: {
        temp: 72,
        feels_like: 70,
        temp_min: 65,
        temp_max: 78,
        pressure: 1013,
        humidity: 65,
        conditions: [
          {
            id: 800,
            main: 'Clear',
            description: 'clear sky',
            icon: '01d',
          },
        ],
        wind_speed: 5.5,
        wind_deg: 180,
        clouds: 10,
        dt: Date.now() / 1000,
      },
      forecast: [
        {
          date: new Date(Date.now() + 86400000),
          temp_min: 64,
          temp_max: 76,
          conditions: [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }],
          pop: 0.1,
          humidity: 60,
        },
        {
          date: new Date(Date.now() + 172800000),
          temp_min: 66,
          temp_max: 80,
          conditions: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
          pop: 0.4,
          humidity: 70,
        },
        {
          date: new Date(Date.now() + 259200000),
          temp_min: 62,
          temp_max: 74,
          conditions: [{ id: 802, main: 'Clouds', description: 'scattered clouds', icon: '03d' }],
          pop: 0.2,
          humidity: 55,
        },
      ],
      alerts: [],
      location: {
        name: 'Farm Location',
        lat: 40.7128,
        lon: -74.0060,
      },
      last_updated: new Date(),
    },
  });

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun className="text-yellow-500" size={32} />;
      case 'clouds':
        return <Cloud className="text-gray-400" size={32} />;
      case 'rain':
        return <CloudRain className="text-blue-500" size={32} />;
      case 'drizzle':
        return <CloudDrizzle className="text-blue-400" size={32} />;
      case 'snow':
        return <CloudSnow className="text-blue-200" size={32} />;
      default:
        return <Cloud className="text-gray-400" size={32} />;
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'extreme':
        return 'bg-red-100 border-red-400 text-red-800';
      case 'severe':
        return 'bg-orange-100 border-orange-400 text-orange-800';
      case 'moderate':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-400 text-blue-800';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-16 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 border border-gray-200 ${className}`}>
        <div className="text-center text-gray-500">
          <Cloud className="mx-auto mb-2" size={32} />
          <p>Unable to load weather data</p>
        </div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const currentCondition = weather.current.conditions[0];

  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 ${className}`}>
      {/* Weather Alerts */}
      {weather.alerts.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          {weather.alerts.map((alert, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 p-3 rounded-lg border ${getAlertSeverityColor(
                alert.severity
              )}`}
            >
              <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{alert.event}</p>
                <p className="text-xs mt-1 line-clamp-2">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Weather */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} />
            <span>{weather.location.name}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-5xl font-bold text-gray-900">
              {Math.round(weather.current.temp)}°F
            </div>
            <div className="text-sm text-gray-600 mt-1 capitalize">
              {currentCondition.description}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Feels like {Math.round(weather.current.feels_like)}°F
            </div>
          </div>
          <div>{getWeatherIcon(currentCondition.main)}</div>
        </div>

        {/* Current Conditions Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <Wind size={16} className="text-gray-400" />
            <div>
              <div className="text-gray-600">Wind</div>
              <div className="font-medium">{Math.round(weather.current.wind_speed)} mph</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-gray-400" />
            <div>
              <div className="text-gray-600">Humidity</div>
              <div className="font-medium">{weather.current.humidity}%</div>
            </div>
          </div>
        </div>

        {/* 3-Day Forecast */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">3-Day Forecast</h3>
          <div className="space-y-3">
            {weather.forecast.map((day, index) => {
              const dayCondition = day.conditions[0];
              const date = new Date(day.date);
              const dayName =
                index === 0
                  ? 'Tomorrow'
                  : date.toLocaleDateString('en-US', { weekday: 'short' });

              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-medium text-gray-700 w-16">
                      {dayName}
                    </span>
                    <div className="flex-shrink-0">
                      {getWeatherIcon(dayCondition.main)}
                    </div>
                    <span className="text-xs text-gray-600 capitalize flex-1 truncate">
                      {dayCondition.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center text-gray-600">
                      <TrendingDown size={14} className="mr-0.5" />
                      {Math.round(day.temp_min)}°
                    </span>
                    <span className="flex items-center font-medium text-gray-900">
                      <TrendingUp size={14} className="mr-0.5" />
                      {Math.round(day.temp_max)}°
                    </span>
                  </div>
                  {day.pop > 0 && (
                    <div className="ml-2 text-xs text-blue-600">
                      {Math.round(day.pop * 100)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="px-6 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Updated {new Date(weather.last_updated).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
