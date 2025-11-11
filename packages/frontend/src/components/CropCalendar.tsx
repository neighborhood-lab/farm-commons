import { useTranslation } from 'react-i18next';

interface CropCalendarProps {
  year: number;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Sample fields - will be replaced with API data
const SAMPLE_FIELDS = [
  { id: '1', name: 'North Field' },
  { id: '2', name: 'South Field' },
  { id: '3', name: 'Greenhouse' },
];

export default function CropCalendar({ year: _year }: CropCalendarProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="min-w-max">
        {/* Calendar Header - Months */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="w-40 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-3 font-medium text-gray-900 dark:text-white">
            {t('cropPlanning.fields', 'Fields')}
          </div>
          {MONTHS.map((month) => (
            <div
              key={month}
              className="w-24 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t(`months.${month.toLowerCase()}`, month.slice(0, 3))}
            </div>
          ))}
        </div>

        {/* Field Rows */}
        {SAMPLE_FIELDS.map((field) => (
          <div
            key={field.id}
            className="flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            {/* Field Name */}
            <div className="w-40 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-3 font-medium text-gray-700 dark:text-gray-300">
              {field.name}
            </div>

            {/* Month Cells */}
            {MONTHS.map((month) => (
              <div
                key={`${field.id}-${month}`}
                className="w-24 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-2 min-h-[80px]"
              >
                {/* Placeholder for crop cards - will be populated with actual crop planning data */}
                <div className="h-full rounded border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Empty State Message */}
      <div className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {t('cropPlanning.emptyState', 'Click "Add Crop" to start planning your season')}
        </p>
      </div>
    </div>
  );
}
