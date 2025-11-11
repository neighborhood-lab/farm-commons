import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/Button';

interface CropLibraryProps {
  onClose: () => void;
}

// Sample crop data - will be replaced with API data
const SAMPLE_CROPS = [
  { id: '1', name: 'Tomatoes', family: 'Nightshade', color: '#EF4444', season: 'Summer' },
  { id: '2', name: 'Lettuce', family: 'Leafy Greens', color: '#10B981', season: 'Spring/Fall' },
  { id: '3', name: 'Carrots', family: 'Root Vegetables', color: '#F59E0B', season: 'Spring/Fall' },
  { id: '4', name: 'Beans', family: 'Legumes', color: '#8B5CF6', season: 'Summer' },
  { id: '5', name: 'Corn', family: 'Grains', color: '#F59E0B', season: 'Summer' },
  { id: '6', name: 'Peppers', family: 'Nightshade', color: '#EF4444', season: 'Summer' },
];

export default function CropLibrary({ onClose }: CropLibraryProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('cropPlanning.cropLibrary', 'Crop Library')}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Crop Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SAMPLE_CROPS.map((crop) => (
              <button
                key={crop.id}
                className="flex items-center gap-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 p-4 text-left transition-all hover:border-green-500 hover:shadow-md"
                onClick={() => {
                  // Placeholder: Will implement drag-drop functionality in Phase 2
                  // For now, this button is disabled
                }}
              >
                <div className="h-12 w-12 rounded-lg" style={{ backgroundColor: crop.color }} />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{crop.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {crop.family} • {crop.season}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              {t('common.close', 'Close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
