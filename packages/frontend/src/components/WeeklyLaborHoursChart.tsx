import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { WeeklyLaborHoursData } from '@farm-commons/shared';
import { format, parseISO } from 'date-fns';

interface WeeklyLaborHoursChartProps {
  data: WeeklyLaborHoursData[];
}

export default function WeeklyLaborHoursChart({ data }: WeeklyLaborHoursChartProps) {
  // Format data for the chart
  const chartData = data.map(item => ({
    ...item,
    dateLabel: format(parseISO(item.date), 'MMM dd'),
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Labor Hours</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#cbd5e0' }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#cbd5e0' }}
            label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.375rem'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'hours') return [`${value.toFixed(1)} hours`, 'Total Hours'];
              if (name === 'workers') return [`${value} workers`, 'Active Workers'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar dataKey="hours" fill="#8b5cf6" name="Total Hours" />
          <Bar dataKey="workers" fill="#3b82f6" name="Workers" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
