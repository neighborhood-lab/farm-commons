import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, Clock, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import type { FarmStats } from '@farm-commons/shared';
import WeatherWidget from '../components/WeatherWidget';

export default function DashboardPage() {
  const { t } = useTranslation();
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

  const statCards = [
    {
      name: t('dashboard.activeWorkers'),
      value: stats?.active_workers || 0,
      total: stats?.total_workers || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: t('dashboard.shiftsToday'),
      value: stats?.scheduled_shifts_today || 0,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      name: t('dashboard.hoursThisWeek'),
      value: stats?.total_hours_this_week || 0,
      icon: Clock,
      color: 'bg-purple-500',
    },
    {
      name: t('dashboard.fields'),
      value: stats?.total_fields || 0,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  if (isLoading) {
    return <div>{t('dashboard.loading')}</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome to Farm Commons - Overview of your farm operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                    {stat.total && (
                      <span className="text-lg text-gray-500 dark:text-gray-400">/{stat.total}</span>
                    )}
                  </p>
                </div>
                <div className={`${stat.color} dark:opacity-90 p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weather Widget */}
      <div className="mb-8">
        <WeatherWidget />
      </div>

      {/* Welcome Message */}
      <div className="bg-earth-50 dark:bg-earth-900/50 border border-earth-200 dark:border-earth-800 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-earth-900 dark:text-earth-100 mb-4">
          Welcome to Farm Commons MVP
        </h2>
        <div className="prose dark:prose-invert text-earth-700 dark:text-earth-300">
          <p className="mb-4">
            {t('dashboard.phase1Features')}
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>{t('dashboard.feature1')}</li>
            <li>{t('dashboard.feature2')}</li>
            <li>{t('dashboard.feature3')}</li>
          </ul>
          <p className="text-sm mt-6 pt-6 border-t border-earth-300 dark:border-earth-700">
            Built for farmworkers and small-scale farmers, not corporations. <br />
            Community owned · AGPL-3.0 Licensed · Open Source
          </p>
        </div>
      </div>
    </div>
  );
}
