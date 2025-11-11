import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { FieldUtilizationData } from '@farm-commons/shared';

interface FieldUtilizationChartProps {
  data: FieldUtilizationData[];
}

// Color palette for the pie chart
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'];

export default function FieldUtilizationChart({ data }: FieldUtilizationChartProps) {
  // Custom label to show percentage
  const renderCustomLabel = (entry: FieldUtilizationData & { percent?: number }) => {
    const percent = entry.percent ? (entry.percent * 100).toFixed(0) : entry.percentage.toFixed(0);
    return `${percent}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Field Utilization</h2>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No field utilization data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="hours_used"
                nameKey="field_name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: { payload: FieldUtilizationData }) => {
                  return [
                    `${value.toFixed(1)} hours (${props.payload.percentage.toFixed(1)}%)`,
                    props.payload.field_name
                  ];
                }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: { payload?: FieldUtilizationData }) => {
                  const payload = entry.payload;
                  if (payload) {
                    return `${payload.field_name} (${payload.hours_used.toFixed(1)}h)`;
                  }
                  return value;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Summary stats */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Fields</p>
                <p className="text-lg font-bold text-gray-900">{data.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Hours</p>
                <p className="text-lg font-bold text-gray-900">
                  {data.reduce((sum, field) => sum + field.hours_used, 0).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
