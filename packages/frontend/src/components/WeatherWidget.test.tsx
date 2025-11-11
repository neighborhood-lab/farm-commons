import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WeatherWidget from './WeatherWidget';
import type { WeatherData } from '@farm-commons/shared';
import * as apiModule from '../lib/api';

// Mock the API
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockWeatherData: WeatherData = {
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
    name: 'Test Farm',
    lat: 40.7128,
    lon: -74.0060,
  },
  last_updated: new Date('2025-11-10T12:00:00Z'),
};

const mockWeatherDataWithAlerts: WeatherData = {
  ...mockWeatherData,
  alerts: [
    {
      event: 'Severe Thunderstorm Warning',
      start: new Date(Date.now()),
      end: new Date(Date.now() + 7200000),
      description: 'Severe thunderstorms expected in the area',
      severity: 'severe',
    },
  ],
};

describe('WeatherWidget', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderWeatherWidget = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <WeatherWidget {...props} />
      </QueryClientProvider>
    );
  };

  it('renders loading state initially', () => {
    vi.mocked(apiModule.api.get).mockImplementation(() => new Promise(() => {}));

    renderWeatherWidget();

    expect(screen.getByText((content, element) => {
      return element?.className.includes('animate-pulse') || false;
    })).toBeInTheDocument();
  });

  it('renders current weather data', async () => {
    vi.mocked(apiModule.api.get).mockResolvedValue(mockWeatherData);

    renderWeatherWidget();

    await waitFor(() => {
      expect(screen.getByText('72°F')).toBeInTheDocument();
    });

    expect(screen.getByText('clear sky')).toBeInTheDocument();
    expect(screen.getByText('Feels like 70°F')).toBeInTheDocument();
    expect(screen.getByText('Test Farm')).toBeInTheDocument();
  });

  it('displays wind speed and humidity', async () => {
    vi.mocked(apiModule.api.get).mockResolvedValue(mockWeatherData);

    renderWeatherWidget();

    await waitFor(() => {
      expect(screen.getByText('6 mph')).toBeInTheDocument(); // rounded from 5.5
    });

    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('renders 3-day forecast', async () => {
    vi.mocked(apiModule.api.get).mockResolvedValue(mockWeatherData);

    renderWeatherWidget();

    await waitFor(() => {
      expect(screen.getByText('3-Day Forecast')).toBeInTheDocument();
    });

    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    expect(screen.getByText('few clouds')).toBeInTheDocument();
    expect(screen.getByText('light rain')).toBeInTheDocument();
    expect(screen.getByText('scattered clouds')).toBeInTheDocument();
  });

  it('displays forecast temperatures', async () => {
    vi.mocked(apiModule.api.get).mockResolvedValue(mockWeatherData);

    renderWeatherWidget();

    await waitFor(() => {
      expect(screen.getByText('3-Day Forecast')).toBeInTheDocument();
    });

    // Check for temperature ranges (high and low)
    expect(screen.getByText('64°')).toBeInTheDocument();
    expect(screen.getByText('76°')).toBeInTheDocument();
    expect(screen.getByText('80°')).toBeInTheDocument();
  });

  it('displays precipitation probability when available', async () => {
    vi.mocked(apiModule.api.get).mockResolvedValue(mockWeatherData);

    renderWeatherWidget();

    await waitFor(() => {
      expect(screen.getByText('40%')).toBeInTheDocument(); // 0.4 * 100
    });

    expect(screen.getByText('10%')).toBeInTheDocument(); // 0.1 * 100
    expect(screen.getByText('20%')).toBeInTheDocument(); // 0.2 * 100
  });

  it('renders weather alerts', async () => {
    vi.mocked(apiModule.api.get).mockResolvedValue(mockWeatherDataWithAlerts);

    renderWeatherWidget();

    await waitFor(() => {
      expect(screen.getByText('Severe Thunderstorm Warning')).toBeInTheDocument();
    });

    expect(screen.getByText('Severe thunderstorms expected in the area')).toBeInTheDocument();
  });

  it('does not render alerts section when no alerts', async () => {
    vi.mocked(apiModule.api.get).mockResolvedValue(mockWeatherData);

    renderWeatherWidget();

    await waitFor(() => {
      expect(screen.getByText('72°F')).toBeInTheDocument();
    });

    expect(screen.queryByText(/warning/i)).not.toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    vi.mocked(apiModule.api.get).mockRejectedValue(new Error('API Error'));

    renderWeatherWidget();

    await waitFor(() => {
      expect(screen.getByText('Unable to load weather data')).toBeInTheDocument();
    });
  });

  it('displays last updated time', async () => {
    vi.mocked(apiModule.api.get).mockResolvedValue(mockWeatherData);

    renderWeatherWidget();

    await waitFor(() => {
      expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });
  });

  it('applies custom className', async () => {
    vi.mocked(apiModule.api.get).mockResolvedValue(mockWeatherData);

    const { container } = renderWeatherWidget({ className: 'custom-class' });

    await waitFor(() => {
      expect(screen.getByText('72°F')).toBeInTheDocument();
    });

    const widget = container.firstChild as HTMLElement;
    expect(widget.className).toContain('custom-class');
  });

  it('shows correct weather icon for different conditions', async () => {
    const clearWeather = { ...mockWeatherData };
    clearWeather.current.conditions[0].main = 'Clear';

    vi.mocked(apiModule.api.get).mockResolvedValue(clearWeather);

    const { rerender } = renderWeatherWidget();

    await waitFor(() => {
      expect(screen.getByText('clear sky')).toBeInTheDocument();
    });

    // Re-render with different weather
    const rainyWeather = { ...mockWeatherData };
    rainyWeather.current.conditions[0] = {
      id: 500,
      main: 'Rain',
      description: 'moderate rain',
      icon: '10d',
    };

    vi.mocked(apiModule.api.get).mockResolvedValue(rainyWeather);

    queryClient.clear();

    rerender(
      <QueryClientProvider client={queryClient}>
        <WeatherWidget />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('moderate rain')).toBeInTheDocument();
    });
  });
});
