import { useState } from 'react';
import { Bell, Mail, MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationPreferences {
  email: {
    scheduleChanges: boolean;
    certificationExpiring: boolean;
    timeEntryReminders: boolean;
    weeklyDigest: boolean;
  };
  sms: {
    scheduleChanges: boolean;
    emergencyAlerts: boolean;
    clockInReminders: boolean;
  };
  timing: {
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      scheduleChanges: true,
      certificationExpiring: true,
      timeEntryReminders: false,
      weeklyDigest: true,
    },
    sms: {
      scheduleChanges: true,
      emergencyAlerts: true,
      clockInReminders: false,
    },
    timing: {
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  const handleEmailToggle = (key: keyof NotificationPreferences['email']) => {
    setPreferences((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: !prev.email[key],
      },
    }));
  };

  const handleSmsToggle = (key: keyof NotificationPreferences['sms']) => {
    setPreferences((prev) => ({
      ...prev,
      sms: {
        ...prev.sms,
        [key]: !prev.sms[key],
      },
    }));
  };

  const handleTimingToggle = () => {
    setPreferences((prev) => ({
      ...prev,
      timing: {
        ...prev.timing,
        quietHoursEnabled: !prev.timing.quietHoursEnabled,
      },
    }));
  };

  const handleTimingChange = (field: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    setPreferences((prev) => ({
      ...prev,
      timing: {
        ...prev.timing,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real implementation, this would be:
      // await api.put('/users/notification-preferences', preferences);

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTestNotificationSent(false);

    try {
      // Simulate sending test notification
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In a real implementation:
      // await api.post('/users/test-notification');

      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 5000);
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Bell size={32} />
          Notification Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Manage how and when you receive notifications about farm activities
        </p>
      </div>

      {/* Save Status Banner */}
      {saveStatus !== 'idle' && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            saveStatus === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {saveStatus === 'success' ? (
            <>
              <CheckCircle size={20} />
              <span className="font-medium">Preferences saved successfully!</span>
            </>
          ) : (
            <>
              <AlertCircle size={20} />
              <span className="font-medium">Failed to save preferences. Please try again.</span>
            </>
          )}
        </div>
      )}

      {/* Email Notifications Section */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Email Notifications</h2>
            <p className="text-sm text-gray-600">Receive updates via email</p>
          </div>
        </div>

        <div className="space-y-4">
          <NotificationToggle
            label="Schedule Changes"
            description="Get notified when your work schedule is updated or changed"
            checked={preferences.email.scheduleChanges}
            onChange={() => handleEmailToggle('scheduleChanges')}
          />
          <NotificationToggle
            label="Certification Expiring"
            description="Reminders when certifications are expiring within 30 days"
            checked={preferences.email.certificationExpiring}
            onChange={() => handleEmailToggle('certificationExpiring')}
          />
          <NotificationToggle
            label="Time Entry Reminders"
            description="Reminders to submit or verify time entries"
            checked={preferences.email.timeEntryReminders}
            onChange={() => handleEmailToggle('timeEntryReminders')}
          />
          <NotificationToggle
            label="Weekly Digest"
            description="Summary of your week's activities and upcoming schedules"
            checked={preferences.email.weeklyDigest}
            onChange={() => handleEmailToggle('weeklyDigest')}
          />
        </div>
      </div>

      {/* SMS Notifications Section */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageSquare className="text-green-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">SMS Notifications</h2>
            <p className="text-sm text-gray-600">Receive text messages for urgent updates</p>
          </div>
        </div>

        <div className="space-y-4">
          <NotificationToggle
            label="Schedule Changes"
            description="Text alerts for last-minute schedule changes"
            checked={preferences.sms.scheduleChanges}
            onChange={() => handleSmsToggle('scheduleChanges')}
          />
          <NotificationToggle
            label="Emergency Alerts"
            description="Important farm-wide announcements and emergencies"
            checked={preferences.sms.emergencyAlerts}
            onChange={() => handleSmsToggle('emergencyAlerts')}
          />
          <NotificationToggle
            label="Clock-In Reminders"
            description="Reminder to clock in when your shift is about to start"
            checked={preferences.sms.clockInReminders}
            onChange={() => handleSmsToggle('clockInReminders')}
          />
        </div>
      </div>

      {/* Timing Preferences Section */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Clock className="text-purple-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Notification Timing</h2>
            <p className="text-sm text-gray-600">Control when you receive notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          <NotificationToggle
            label="Enable Quiet Hours"
            description="Pause non-urgent notifications during specified hours"
            checked={preferences.timing.quietHoursEnabled}
            onChange={handleTimingToggle}
          />

          {preferences.timing.quietHoursEnabled && (
            <div className="ml-12 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.timing.quietHoursStart}
                    onChange={(e) => handleTimingChange('quietHoursStart', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.timing.quietHoursEnd}
                    onChange={(e) => handleTimingChange('quietHoursEnd', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Emergency alerts will still be delivered during quiet hours
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-earth-700 text-white rounded-lg hover:bg-earth-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>

        <button
          onClick={handleTestNotification}
          className="px-6 py-3 bg-white text-earth-700 border border-earth-700 rounded-lg hover:bg-earth-50 transition-colors font-medium"
        >
          Send Test Notification
        </button>

        {testNotificationSent && (
          <span className="text-green-600 flex items-center gap-2">
            <CheckCircle size={18} />
            Test notification sent!
          </span>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Notification preferences are saved per user. Email notifications
          will be sent to your registered email address, and SMS notifications to your registered
          phone number.
        </p>
      </div>
    </div>
  );
}

// Toggle Component
interface NotificationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function NotificationToggle({ label, description, checked, onChange }: NotificationToggleProps) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900">{label}</h3>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-earth-500 focus:ring-offset-2 ${
          checked ? 'bg-earth-600' : 'bg-gray-300'
        }`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
