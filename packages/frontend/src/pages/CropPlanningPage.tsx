import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus } from 'lucide-react';
import CropCalendar from '../components/CropCalendar';
import CropLibrary from '../components/CropLibrary';
import { Button } from '../components/ui/Button';

export default function CropPlanningPage() {
  const { t } = useTranslation();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showLibrary, setShowLibrary] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-8 w-8 text-green-600" />
            {t('cropPlanning.title', 'Crop Planning Calendar')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('cropPlanning.subtitle', 'Plan your seasonal crop rotations and planting schedules')}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Add Crop Button */}
          <Button onClick={() => setShowLibrary(!showLibrary)} className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('cropPlanning.addCrop', 'Add Crop')}
          </Button>
        </div>
      </div>

      {/* Crop Library Sidebar */}
      {showLibrary && <CropLibrary onClose={() => setShowLibrary(false)} />}

      {/* Calendar View */}
      <CropCalendar year={selectedYear} />

      {/* Help Text */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-100">
          {t('cropPlanning.helpTitle', 'Planning Tips')}
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>• {t('cropPlanning.tip1', 'Drag crops from the library to plan your seasons')}</li>
          <li>
            • {t('cropPlanning.tip2', 'Color-coding helps visualize crop families for rotation')}
          </li>
          <li>
            • {t('cropPlanning.tip3', 'System warns about incompatible succession plantings')}
          </li>
        </ul>
      </div>
    </div>
  );
}
