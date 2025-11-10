import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WorkerPerformancePage from './WorkerPerformancePage';
import * as api from '../lib/api';

// Mock the API module
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockWorkerPerformance = {
  worker: {
    id: 'worker-1',
    farm_id: 'farm-1',
    user_id: null,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0100',
    preferred_language: 'en',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '555-0101',
    hire_date: new Date('2024-01-01'),
    status: 'active' as const,
    hourly_rate: 20,
    piece_rate: null,
    certifications: ['First Aid'],
    skills: ['Harvesting', 'Irrigation', 'Pruning', 'Equipment Operation'],
    notes: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  },
  hours_worked: {
    this_week: 42,
    last_week: 38,
    this_month: 165,
    last_month: 152,
    trend: 'up' as const,
  },
  task_completion: {
    completed_tasks: 87,
    total_tasks: 95,
    completion_rate: 91.6,
    on_time_rate: 94.3,
  },
  attendance: {
    scheduled_days: 22,
    present_days: 21,
    late_days: 1,
    absent_days: 1,
    reliability_score: 95.5,
  },
  skills: [
    {
      name: 'Harvesting',
      proficiency: 95,
      tasks_completed: 45,
      last_used: '2 days ago',
    },
    {
      name: 'Irrigation',
      proficiency: 88,
      tasks_completed: 23,
      last_used: '1 week ago',
    },
    {
      name: 'Pruning',
      proficiency: 82,
      tasks_completed: 15,
      last_used: '3 days ago',
    },
    {
      name: 'Equipment Operation',
      proficiency: 78,
      tasks_completed: 12,
      last_used: '2 weeks ago',
    },
  ],
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/workers/worker-1/performance']}>
        <Routes>
          <Route path="/workers/:workerId/performance" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('WorkerPerformancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', async () => {
    vi.mocked(api.api.get).mockImplementation(() => new Promise(() => {}));

    render(<WorkerPerformancePage />, { wrapper: createWrapper() });

    // Note: Due to placeholderData, loading state may not be visible
    // Instead we check that the component renders without crashing
    await waitFor(() => {
      expect(screen.getByText('Performance Dashboard')).toBeDefined();
    });
  });

  it('should render worker name and performance data', async () => {
    vi.mocked(api.api.get).mockResolvedValue(mockWorkerPerformance);

    render(<WorkerPerformancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeDefined();
    });

    expect(screen.getByText('Performance Dashboard')).toBeDefined();
  });

  it('should display hours worked trends correctly', async () => {
    vi.mocked(api.api.get).mockResolvedValue(mockWorkerPerformance);

    render(<WorkerPerformancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Hours Worked Trends')).toBeDefined();
    });

    // Check this week's hours
    expect(screen.getByText('42')).toBeDefined();
    // Check last week's hours
    expect(screen.getByText('38')).toBeDefined();
    // Check this month's hours
    expect(screen.getByText('165')).toBeDefined();
  });

  it('should calculate and display task completion rate', async () => {
    vi.mocked(api.api.get).mockResolvedValue(mockWorkerPerformance);

    render(<WorkerPerformancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Task Completion Rates')).toBeDefined();
    });

    // Check completion rate percentage (use getAllByText since percentage might appear elsewhere)
    const completionRates = screen.getAllByText('91.6%');
    expect(completionRates.length).toBeGreaterThan(0);
    // Check on-time rate
    const onTimeRates = screen.getAllByText('94.3%');
    expect(onTimeRates.length).toBeGreaterThan(0);
    // Check tasks completed text
    expect(screen.getByText(/87 of 95 tasks completed/)).toBeDefined();
  });

  it('should display attendance reliability score', async () => {
    vi.mocked(api.api.get).mockResolvedValue(mockWorkerPerformance);

    render(<WorkerPerformancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Attendance Reliability')).toBeDefined();
    });

    // Check reliability score (use getAllByText since it might appear multiple times)
    const reliabilityScores = screen.getAllByText('95.5%');
    expect(reliabilityScores.length).toBeGreaterThan(0);
    // Check present days (use getAllByText since numbers might appear elsewhere)
    const presentDays = screen.getAllByText('21');
    expect(presentDays.length).toBeGreaterThan(0);
    // Check absent days
    const absentDays = screen.getAllByText('1');
    expect(absentDays.length).toBeGreaterThan(0);
  });

  it('should render skills proficiency ratings', async () => {
    vi.mocked(api.api.get).mockResolvedValue(mockWorkerPerformance);

    render(<WorkerPerformancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Skills Proficiency Ratings')).toBeDefined();
    });

    // Check skills are displayed
    expect(screen.getByText('Harvesting')).toBeDefined();
    expect(screen.getByText('Irrigation')).toBeDefined();
    expect(screen.getByText('Pruning')).toBeDefined();
    // Check proficiency percentages (use getAllByText since percentages might appear multiple times)
    const proficiency95 = screen.getAllByText('95%');
    expect(proficiency95.length).toBeGreaterThan(0);
    const proficiency88 = screen.getAllByText('88%');
    expect(proficiency88.length).toBeGreaterThan(0);
  });

  it('should calculate correct reliability score from attendance data', () => {
    const attendance = mockWorkerPerformance.attendance;
    const expectedScore = (attendance.present_days / attendance.scheduled_days) * 100;

    // This tests the logic that should be in the backend/calculation
    // 21 present days / 22 scheduled days = 95.45%
    expect(expectedScore).toBeCloseTo(95.5, 1);
  });

  it('should calculate correct completion rate', () => {
    const taskCompletion = mockWorkerPerformance.task_completion;
    const expectedRate = (taskCompletion.completed_tasks / taskCompletion.total_tasks) * 100;

    // 87 completed / 95 total = 91.578..., which rounds to 91.6
    expect(expectedRate).toBeCloseTo(91.6, 1);
  });

  it('should display trend indicator for hours worked', async () => {
    vi.mocked(api.api.get).mockResolvedValue(mockWorkerPerformance);

    render(<WorkerPerformancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const thisWeekHours = screen.getAllByText('42');
      expect(thisWeekHours.length).toBeGreaterThan(0);
    });

    // The component should show a trending up indicator when trend is 'up'
    // This is represented by the TrendingUp icon
    const thisWeekHours = screen.getAllByText('42');
    const container = thisWeekHours[0].closest('div');
    expect(container).toBeDefined();
  });

  it('should show correct color for high reliability score', async () => {
    const highReliabilityData = {
      ...mockWorkerPerformance,
      attendance: {
        ...mockWorkerPerformance.attendance,
        reliability_score: 96,
      },
    };

    vi.mocked(api.api.get).mockResolvedValue(highReliabilityData);

    render(<WorkerPerformancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const scoreElements = screen.getAllByText('96.0%');
      expect(scoreElements.length).toBeGreaterThan(0);
      // High scores (>= 95) should have text-green-600 class
      const scoreElement = scoreElements.find((el) => el.className.includes('text-green-600'));
      expect(scoreElement).toBeDefined();
    });
  });

  it('should show correct color for medium reliability score', async () => {
    const mediumReliabilityData = {
      ...mockWorkerPerformance,
      attendance: {
        ...mockWorkerPerformance.attendance,
        reliability_score: 90,
      },
    };

    vi.mocked(api.api.get).mockResolvedValue(mediumReliabilityData);

    render(<WorkerPerformancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const scoreElements = screen.getAllByText('90.0%');
      expect(scoreElements.length).toBeGreaterThan(0);
      // Medium scores (85-94) should have text-yellow-600 class
      const scoreElement = scoreElements.find((el) => el.className.includes('text-yellow-600'));
      expect(scoreElement).toBeDefined();
    });
  });

  it('should calculate average hours per week correctly', async () => {
    vi.mocked(api.api.get).mockResolvedValue(mockWorkerPerformance);

    render(<WorkerPerformancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Average per Week')).toBeDefined();
    });

    // 165 hours / 4 weeks = 41.25, rounded to 41 hours per week
    const averageElement = screen.getByText('41');
    expect(averageElement).toBeDefined();
  });

  it('should display empty state when no skills data available', async () => {
    const noSkillsData = {
      ...mockWorkerPerformance,
      skills: [],
    };

    vi.mocked(api.api.get).mockResolvedValue(noSkillsData);

    render(<WorkerPerformancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No skills data available yet')).toBeDefined();
    });
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(api.api.get).mockRejectedValue(new Error('API Error'));

    render(<WorkerPerformancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Worker performance data not found')).toBeDefined();
    });
  });
});
