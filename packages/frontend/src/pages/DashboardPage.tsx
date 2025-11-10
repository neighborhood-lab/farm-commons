import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, Clock, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';
import type {
  FarmStats,
  WeeklyLaborHoursData,
  WorkerAttendanceData,
  FieldUtilizationData,
  CertificationExpiryData,
} from '@farm-commons/shared';
import WeeklyLaborHoursChart from '../components/WeeklyLaborHoursChart';
import WorkerAttendanceHeatmap from '../components/WorkerAttendanceHeatmap';
import FieldUtilizationChart from '../components/FieldUtilizationChart';
import CertificationExpiriesList from '../components/CertificationExpiriesList';
import { subDays, format } from 'date-fns';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['farm-stats'],
    queryFn: () => api.get<FarmStats>('/stats/farm'),
    // Mock data for MVP
    placeholderData: {
      total_workers: 12,
      active_workers: 8,
      total_fields: 5,
      total_hours_this_week: 256,
      scheduled_shifts_today: 4,
    },
  });

  // Query for weekly labor hours data
  const { data: laborHoursData } = useQuery({
    queryKey: ['labor-hours'],
    queryFn: () => api.get<WeeklyLaborHoursData[]>('/stats/labor-hours'),
    // Mock data for MVP
    placeholderData: Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'yyyy-MM-dd'),
        hours: Math.random() * 50 + 20,
        workers: Math.floor(Math.random() * 5) + 4,
      };
    }),
  });

  // Query for worker attendance data
  const { data: attendanceData } = useQuery({
    queryKey: ['worker-attendance'],
    queryFn: () => api.get<WorkerAttendanceData[]>('/stats/worker-attendance'),
    // Mock data for MVP
    placeholderData: Array.from({ length: 8 }, (_, workerIndex) => ({
      worker_id: `worker-${workerIndex + 1}`,
      worker_name: `Worker ${workerIndex + 1}`,
      dates: Array.from({ length: 7 }, (_, dayIndex) => {
        const date = subDays(new Date(), 6 - dayIndex);
        const present = Math.random() > 0.2;
        return {
          date: format(date, 'yyyy-MM-dd'),
          present,
          hours: present ? Math.random() * 8 + 2 : 0,
        };
      }),
    })),
  });

  // Query for field utilization data
  const { data: fieldUtilizationData } = useQuery({
    queryKey: ['field-utilization'],
    queryFn: () => api.get<FieldUtilizationData[]>('/stats/field-utilization'),
    // Mock data for MVP
    placeholderData: [
      { field_id: '1', field_name: 'North Field', hours_used: 85, percentage: 28.3 },
      { field_id: '2', field_name: 'South Field', hours_used: 72, percentage: 24.0 },
      { field_id: '3', field_name: 'East Field', hours_used: 65, percentage: 21.7 },
      { field_id: '4', field_name: 'West Field', hours_used: 48, percentage: 16.0 },
      { field_id: '5', field_name: 'Greenhouse', hours_used: 30, percentage: 10.0 },
    ],
  });

  // Query for certification expiries
  const { data: certificationExpiriesData } = useQuery({
    queryKey: ['certification-expiries'],
    queryFn: () => api.get<CertificationExpiryData[]>('/certifications/expiring'),
    // Mock data for MVP
    placeholderData: [
      {
        id: '1',
        worker_id: 'w1',
        worker_name: 'Juan Martinez',
        certification_name: 'Pesticide Applicator License',
        expiration_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        days_until_expiry: 15,
      },
      {
        id: '2',
        worker_id: 'w2',
        worker_name: 'Maria Rodriguez',
        certification_name: 'Forklift Certification',
        expiration_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        days_until_expiry: 45,
      },
      {
        id: '3',
        worker_id: 'w3',
        worker_name: 'Carlos Hernandez',
        certification_name: 'First Aid & CPR',
        expiration_date: new Date(Date.now() + 72 * 24 * 60 * 60 * 1000),
        days_until_expiry: 72,
      },
      {
        id: '4',
        worker_id: 'w4',
        worker_name: 'Ana Lopez',
        certification_name: 'Tractor Operation License',
        expiration_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        days_until_expiry: 5,
      },
    ],
  });

  const statCards = [
    {
      name: 'Active Workers',
      value: stats?.active_workers || 0,
      total: stats?.total_workers || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Shifts Today',
      value: stats?.scheduled_shifts_today || 0,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      name: 'Hours This Week',
      value: stats?.total_hours_this_week || 0,
      icon: Clock,
      color: 'bg-purple-500',
    },
    {
      name: 'Fields',
      value: stats?.total_fields || 0,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your farm operations and analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                    {stat.total && (
                      <span className="text-lg text-gray-500">/{stat.total}</span>
                    )}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Labor Hours Chart */}
        <WeeklyLaborHoursChart data={laborHoursData || []} />

        {/* Field Utilization Chart */}
        <FieldUtilizationChart data={fieldUtilizationData || []} />
      </div>

      {/* Worker Attendance Heatmap - Full Width */}
      <div className="mb-8">
        <WorkerAttendanceHeatmap data={attendanceData || []} />
      </div>

      {/* Certification Expiries List */}
      <div className="mb-8">
        <CertificationExpiriesList data={certificationExpiriesData || []} />
      </div>

      {/* Welcome Message */}
      <div className="bg-earth-50 border border-earth-200 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-earth-900 mb-4">
          Welcome to Farm Commons MVP
        </h2>
        <div className="prose text-earth-700">
          <p className="mb-4">
            This dashboard provides real-time insights into your farm operations:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li><strong>Worker Management:</strong> Track attendance, hours, and certifications</li>
            <li><strong>Field Analytics:</strong> Monitor field utilization and labor distribution</li>
            <li><strong>Compliance:</strong> Stay ahead of certification expiration dates</li>
            <li><strong>Labor Tracking:</strong> Visualize weekly trends and worker patterns</li>
          </ul>
          <p className="text-sm mt-6 pt-6 border-t border-earth-300">
            Built for farmworkers and small-scale farmers, not corporations. <br />
            Community owned · AGPL-3.0 Licensed · Open Source
          </p>
        </div>
      </div>
    </div>
  );
}
