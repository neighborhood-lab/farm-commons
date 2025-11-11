import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Calendar, Download, Share2, TrendingUp, TrendingDown, Users, Clock } from 'lucide-react';
import { format, subDays, subYears } from 'date-fns';
import { api } from '../lib/api';

interface LaborHoursData {
  period: string;
  total_hours: number;
  worker_count: number;
  entry_count: number;
}

interface FarmStatsData {
  total_workers: number;
  active_workers: number;
  total_fields: number;
  active_schedules: number;
  total_labor_hours: number;
  month_labor_hours: number;
  unverified_entries: number;
}

interface FieldUtilizationData {
  fields: Array<{
    field_id: string;
    field_name: string;
    size_acres: number;
    current_crop: string | null;
    total_hours: number;
    hours_per_acre: number;
    time_entry_count: number;
    schedule_count: number;
  }>;
  summary: {
    total_fields: number;
    total_hours: number;
    total_acres: number;
    average_hours_per_acre: number;
  };
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    start: format(subDays(today, 30), 'yyyy-MM-dd'),
    end: format(today, 'yyyy-MM-dd'),
  });
  const [comparisonEnabled, setComparisonEnabled] = useState(true);
  const [shareableLink, setShareableLink] = useState<string | null>(null);

  // Calculate comparison date range (same period last year)
  const comparisonRange = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    return {
      start: format(subYears(start, 1), 'yyyy-MM-dd'),
      end: format(subYears(end, 1), 'yyyy-MM-dd'),
    };
  }, [dateRange]);

  // Fetch current period labor hours
  const { data: laborHours, isLoading: laborLoading } = useQuery({
    queryKey: ['labor-hours', dateRange],
    queryFn: () =>
      api.get<{ period: string; start_date: Date; end_date: Date; labor_hours: LaborHoursData[] }>(
        `/stats/labor-hours?period=week&start_date=${dateRange.start}&end_date=${dateRange.end}`
      ),
  });

  // Fetch comparison period labor hours
  const { data: comparisonLaborHours } = useQuery({
    queryKey: ['labor-hours-comparison', comparisonRange],
    queryFn: () =>
      api.get<{ period: string; start_date: Date; end_date: Date; labor_hours: LaborHoursData[] }>(
        `/stats/labor-hours?period=week&start_date=${comparisonRange.start}&end_date=${comparisonRange.end}`
      ),
    enabled: comparisonEnabled,
  });

  // Fetch farm stats
  const { data: farmStats } = useQuery({
    queryKey: ['farm-stats'],
    queryFn: () => api.get<FarmStatsData>('/stats/farm'),
  });

  // Fetch field utilization
  const { data: fieldUtilization } = useQuery({
    queryKey: ['field-utilization'],
    queryFn: () => api.get<FieldUtilizationData>('/stats/field-utilization'),
  });

  // Calculate period over period change
  const periodComparison = useMemo(() => {
    if (!laborHours?.labor_hours || !comparisonLaborHours?.labor_hours) return null;

    const currentTotal = laborHours.labor_hours.reduce((sum, item) => sum + item.total_hours, 0);
    const previousTotal = comparisonLaborHours.labor_hours.reduce(
      (sum, item) => sum + item.total_hours,
      0
    );

    const change = currentTotal - previousTotal;
    const percentChange = previousTotal > 0 ? (change / previousTotal) * 100 : 0;

    return {
      change,
      percentChange,
      isPositive: change >= 0,
    };
  }, [laborHours, comparisonLaborHours]);

  // Prepare combined chart data
  const combinedChartData = useMemo(() => {
    if (!laborHours?.labor_hours) return [];

    const current = laborHours.labor_hours;
    const previous = comparisonLaborHours?.labor_hours || [];

    return current.map((item, index) => ({
      period: item.period,
      current: item.total_hours,
      previous: previous[index]?.total_hours || 0,
      workers: item.worker_count,
    }));
  }, [laborHours, comparisonLaborHours]);

  // Export to PDF
  const handleExportPDF = async () => {
    try {
      // Create a simple text-based report
      const reportData = {
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        dateRange: `${dateRange.start} to ${dateRange.end}`,
        farmStats,
        laborHours: laborHours?.labor_hours,
        fieldUtilization: fieldUtilization,
        comparison: periodComparison,
      };

      // Convert to JSON and create a downloadable file
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `farm-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      // Note: For full PDF support, we would need to add jspdf library
      alert('Analytics exported successfully! (JSON format - PDF support coming soon)');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Export error:', error);
      alert('Failed to export analytics');
    }
  };

  // Generate shareable link
  const handleGenerateShareableLink = () => {
    const params = new URLSearchParams({
      start: dateRange.start,
      end: dateRange.end,
      comparison: comparisonEnabled.toString(),
    });
    const link = `${globalThis.location.origin}/analytics?${params.toString()}`;
    setShareableLink(link);
    navigator.clipboard.writeText(link);
    alert('Shareable link copied to clipboard!');
  };

  if (laborLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Advanced insights and comparative analytics</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={18} />
              Export to PDF
            </button>
            <button
              onClick={handleGenerateShareableLink}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Share2 size={18} />
              Share Report
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={comparisonEnabled}
              onChange={(e) => setComparisonEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Compare with last year</span>
          </label>
        </div>
      </div>

      {/* Comparison Metrics */}
      {comparisonEnabled && periodComparison && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Period Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              {periodComparison.isPositive ? (
                <TrendingUp className="text-green-600" size={24} />
              ) : (
                <TrendingDown className="text-red-600" size={24} />
              )}
              <div>
                <p className="text-sm text-gray-600">Total Hours Change</p>
                <p
                  className={`text-2xl font-bold ${
                    periodComparison.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {periodComparison.isPositive ? '+' : ''}
                  {periodComparison.change.toFixed(1)} hrs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Clock className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Percent Change</p>
                <p
                  className={`text-2xl font-bold ${
                    periodComparison.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {periodComparison.isPositive ? '+' : ''}
                  {periodComparison.percentChange.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Period Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {laborHours?.labor_hours
                    .reduce((sum, item) => sum + item.total_hours, 0)
                    .toFixed(1)}{' '}
                  hrs
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Labor Hours Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Labor Hours {comparisonEnabled ? '(Current vs Previous Year)' : ''}
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={combinedChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="current"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Current Period"
            />
            {comparisonEnabled && (
              <Line
                type="monotone"
                dataKey="previous"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Previous Year"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Field Utilization */}
      {fieldUtilization && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Field Hours Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Labor Hours by Field</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fieldUtilization.fields.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="field_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_hours" fill="#10b981" name="Total Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Field Utilization Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Field Utilization Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fieldUtilization.fields}
                  dataKey="total_hours"
                  nameKey="field_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {fieldUtilization.fields.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Field Details Table */}
      {fieldUtilization && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Detailed Field Statistics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size (Acres)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Crop
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours/Acre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Entries
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fieldUtilization.fields.map((field) => (
                  <tr key={field.field_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {field.field_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {field.size_acres.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {field.current_crop || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {field.total_hours.toFixed(1)} hrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {field.hours_per_acre.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {field.time_entry_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shareable Link Modal */}
      {shareableLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shareable Report Link</h3>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-4">
              <code className="text-sm text-gray-700 break-all">{shareableLink}</code>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This link has been copied to your clipboard. Share it with team members to view this
              analytics report.
            </p>
            <button
              onClick={() => setShareableLink(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
