import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Calendar,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { api } from '../lib/api';
import { getInitials } from '@farm-commons/shared';
import type { Worker } from '@farm-commons/shared';

interface WorkerPerformance {
  worker: Worker;
  hours_worked: {
    this_week: number;
    last_week: number;
    this_month: number;
    last_month: number;
    trend: 'up' | 'down' | 'stable';
  };
  task_completion: {
    completed_tasks: number;
    total_tasks: number;
    completion_rate: number;
    on_time_rate: number;
  };
  attendance: {
    scheduled_days: number;
    present_days: number;
    late_days: number;
    absent_days: number;
    reliability_score: number;
  };
  skills: {
    name: string;
    proficiency: number;
    tasks_completed: number;
    last_used: string;
  }[];
}

export default function WorkerPerformancePage() {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();

  const { data: performance, isLoading } = useQuery({
    queryKey: ['worker-performance', workerId],
    queryFn: () => api.get<WorkerPerformance>(`/stats/workers/${workerId}`),
    // Mock data for MVP
    placeholderData: workerId
      ? {
          worker: {
            id: workerId,
            farm_id: 'farm-1',
            user_id: null,
            first_name: 'Maria',
            last_name: 'Garcia',
            email: 'maria.garcia@example.com',
            phone: '555-0123',
            preferred_language: 'es',
            emergency_contact_name: 'Jose Garcia',
            emergency_contact_phone: '555-0124',
            hire_date: new Date('2024-01-15'),
            status: 'active' as const,
            hourly_rate: 18.5,
            piece_rate: null,
            certifications: ['Pesticide Handler', 'First Aid'],
            skills: ['Harvesting', 'Irrigation', 'Pruning', 'Equipment Operation'],
            notes: null,
            created_at: new Date('2024-01-15'),
            updated_at: new Date('2024-01-15'),
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
        }
      : undefined,
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading performance data...</div>;
  }

  if (!performance) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Worker performance data not found</p>
        <button
          onClick={() => navigate('/workers')}
          className="text-earth-700 hover:text-earth-800"
        >
          Return to Workers
        </button>
      </div>
    );
  }

  const { worker, hours_worked, task_completion, attendance, skills } = performance;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="text-green-600" size={20} />;
      case 'down':
        return <TrendingDown className="text-red-600" size={20} />;
      default:
        return <Minus className="text-gray-600" size={20} />;
    }
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProficiencyColor = (proficiency: number) => {
    if (proficiency >= 90) return 'bg-green-500';
    if (proficiency >= 75) return 'bg-blue-500';
    if (proficiency >= 60) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/workers')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Workers
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-earth-500 text-white rounded-full flex items-center justify-center font-semibold text-2xl">
            {getInitials(worker.first_name, worker.last_name)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {worker.first_name} {worker.last_name}
            </h1>
            <p className="text-gray-600 mt-1">Performance Dashboard</p>
          </div>
        </div>
      </div>

      {/* Hours Worked Trends */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Hours Worked Trends</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">This Week</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-gray-900">{hours_worked.this_week}</p>
              {getTrendIcon(hours_worked.trend)}
            </div>
            <p className="text-xs text-gray-500 mt-1">vs {hours_worked.last_week} last week</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Last Week</p>
            <p className="text-3xl font-bold text-gray-900">{hours_worked.last_week}</p>
            <p className="text-xs text-gray-500 mt-1">hours</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">This Month</p>
            <p className="text-3xl font-bold text-gray-900">{hours_worked.this_month}</p>
            <p className="text-xs text-gray-500 mt-1">vs {hours_worked.last_month} last month</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Average per Week</p>
            <p className="text-3xl font-bold text-gray-900">
              {Math.round(hours_worked.this_month / 4)}
            </p>
            <p className="text-xs text-gray-500 mt-1">this month</p>
          </div>
        </div>
      </div>

      {/* Task Completion & Attendance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Task Completion */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="text-green-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Task Completion Rates</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Completion</span>
                <span className="text-lg font-bold text-green-600">
                  {task_completion.completion_rate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${task_completion.completion_rate}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {task_completion.completed_tasks} of {task_completion.total_tasks} tasks completed
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">On-Time Rate</span>
                <span className="text-lg font-bold text-blue-600">
                  {task_completion.on_time_rate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${task_completion.on_time_rate}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Tasks completed on or before deadline</p>
            </div>
          </div>
        </div>

        {/* Attendance Reliability */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="text-purple-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Attendance Reliability</h2>
          </div>

          <div className="text-center mb-6">
            <p
              className={`text-5xl font-bold ${getReliabilityColor(attendance.reliability_score)}`}
            >
              {attendance.reliability_score.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 mt-2">Reliability Score</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-700">{attendance.present_days}</p>
              <p className="text-xs text-green-600">Present</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-yellow-700">{attendance.late_days}</p>
              <p className="text-xs text-yellow-600">Late</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-red-700">{attendance.absent_days}</p>
              <p className="text-xs text-red-600">Absent</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-blue-700">{attendance.scheduled_days}</p>
              <p className="text-xs text-blue-600">Scheduled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Proficiency */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Award className="text-orange-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Skills Proficiency Ratings</h2>
        </div>

        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.name} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{skill.name}</h3>
                  <p className="text-xs text-gray-500">
                    {skill.tasks_completed} tasks • Last used {skill.last_used}
                  </p>
                </div>
                <span className="text-lg font-bold text-gray-900">{skill.proficiency}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${getProficiencyColor(skill.proficiency)} h-2 rounded-full transition-all`}
                  style={{ width: `${skill.proficiency}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {skills.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Award size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No skills data available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
