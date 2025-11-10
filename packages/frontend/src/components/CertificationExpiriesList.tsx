import type { CertificationExpiryData } from '@farm-commons/shared';
import { format } from 'date-fns';
import { AlertCircle, AlertTriangle, Clock } from 'lucide-react';

interface CertificationExpiriesListProps {
  data: CertificationExpiryData[];
}

export default function CertificationExpiriesList({ data }: CertificationExpiriesListProps) {
  // Sort by days until expiry (ascending)
  const sortedData = [...data].sort((a, b) => a.days_until_expiry - b.days_until_expiry);

  // Get severity level and color based on days until expiry
  const getSeverity = (days: number) => {
    if (days < 0) return { level: 'expired', color: 'text-red-600 bg-red-50', icon: AlertCircle };
    if (days <= 30) return { level: 'critical', color: 'text-red-600 bg-red-50', icon: AlertCircle };
    if (days <= 60) return { level: 'warning', color: 'text-orange-600 bg-orange-50', icon: AlertTriangle };
    return { level: 'info', color: 'text-blue-600 bg-blue-50', icon: Clock };
  };

  const getDaysText = (days: number) => {
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `Expires in ${days} days`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Upcoming Certification Expiries</h2>
        {data.length > 0 && (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            {data.length} certification{data.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {sortedData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="mx-auto mb-2 text-gray-400" size={48} />
          <p>No upcoming certification expiries</p>
          <p className="text-sm mt-1">All certifications are up to date</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedData.map((cert) => {
            const severity = getSeverity(cert.days_until_expiry);
            const Icon = severity.icon;

            return (
              <div
                key={cert.id}
                className={`p-4 rounded-lg border ${severity.color} border-current`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {cert.worker_name}
                        </h3>
                        <p className="text-sm text-gray-700 mt-0.5">
                          {cert.certification_name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium">
                          {getDaysText(cert.days_until_expiry)}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {format(new Date(cert.expiration_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {sortedData.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600" />
              <span className="text-gray-600">Expired or &lt;30 days</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-600" />
              <span className="text-gray-600">30-60 days</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              <span className="text-gray-600">60-90 days</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
