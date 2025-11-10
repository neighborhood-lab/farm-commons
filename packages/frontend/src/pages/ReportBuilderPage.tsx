import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Save,
  Calendar,
  Trash2,
  Plus,
  Clock,
  Users,
  MapPin,
  Activity
} from 'lucide-react';
import { api } from '../lib/api';

// Report field types
interface ReportField {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  source: 'workers' | 'time_entries' | 'schedules' | 'fields';
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  fields: ReportField[];
  filters?: Record<string, any>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    enabled: boolean;
  };
  created_at: Date;
}

// Available data sources and their fields
const availableFields: Record<string, ReportField[]> = {
  workers: [
    { id: 'worker_first_name', name: 'first_name', label: 'First Name', type: 'string', source: 'workers' },
    { id: 'worker_last_name', name: 'last_name', label: 'Last Name', type: 'string', source: 'workers' },
    { id: 'worker_email', name: 'email', label: 'Email', type: 'string', source: 'workers' },
    { id: 'worker_phone', name: 'phone', label: 'Phone', type: 'string', source: 'workers' },
    { id: 'worker_status', name: 'status', label: 'Status', type: 'string', source: 'workers' },
    { id: 'worker_hire_date', name: 'hire_date', label: 'Hire Date', type: 'date', source: 'workers' },
    { id: 'worker_hourly_rate', name: 'hourly_rate', label: 'Hourly Rate', type: 'number', source: 'workers' },
    { id: 'worker_skills', name: 'skills', label: 'Skills', type: 'string', source: 'workers' },
  ],
  time_entries: [
    { id: 'time_worker_name', name: 'worker_name', label: 'Worker Name', type: 'string', source: 'time_entries' },
    { id: 'time_clock_in', name: 'clock_in', label: 'Clock In', type: 'date', source: 'time_entries' },
    { id: 'time_clock_out', name: 'clock_out', label: 'Clock Out', type: 'date', source: 'time_entries' },
    { id: 'time_total_hours', name: 'total_hours', label: 'Total Hours', type: 'number', source: 'time_entries' },
    { id: 'time_break_minutes', name: 'break_minutes', label: 'Break Minutes', type: 'number', source: 'time_entries' },
    { id: 'time_task_type', name: 'task_type', label: 'Task Type', type: 'string', source: 'time_entries' },
    { id: 'time_verified', name: 'verified', label: 'Verified', type: 'boolean', source: 'time_entries' },
  ],
  schedules: [
    { id: 'schedule_worker_name', name: 'worker_name', label: 'Worker Name', type: 'string', source: 'schedules' },
    { id: 'schedule_date', name: 'scheduled_date', label: 'Scheduled Date', type: 'date', source: 'schedules' },
    { id: 'schedule_start_time', name: 'start_time', label: 'Start Time', type: 'string', source: 'schedules' },
    { id: 'schedule_end_time', name: 'end_time', label: 'End Time', type: 'string', source: 'schedules' },
    { id: 'schedule_task_type', name: 'task_type', label: 'Task Type', type: 'string', source: 'schedules' },
    { id: 'schedule_status', name: 'status', label: 'Status', type: 'string', source: 'schedules' },
  ],
  fields: [
    { id: 'field_name', name: 'name', label: 'Field Name', type: 'string', source: 'fields' },
    { id: 'field_size_acres', name: 'size_acres', label: 'Size (Acres)', type: 'number', source: 'fields' },
    { id: 'field_current_crop', name: 'current_crop', label: 'Current Crop', type: 'string', source: 'fields' },
    { id: 'field_soil_type', name: 'soil_type', label: 'Soil Type', type: 'string', source: 'fields' },
  ],
};

export default function ReportBuilderPage() {
  const [selectedFields, setSelectedFields] = useState<ReportField[]>([]);
  const [draggedField, setDraggedField] = useState<ReportField | null>(null);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    time: '09:00',
    enabled: true,
  });

  // Mock templates (in real app, this would come from API)
  const { data: templates } = useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      // Mock data - in real app, fetch from API
      const mockTemplates: ReportTemplate[] = [
        {
          id: '1',
          name: 'Weekly Labor Report',
          description: 'Worker hours and tasks for the week',
          fields: [
            availableFields.workers[0],
            availableFields.workers[1],
            availableFields.time_entries[3],
            availableFields.time_entries[5],
          ],
          created_at: new Date(),
        },
        {
          id: '2',
          name: 'Worker Directory',
          description: 'Complete list of all workers',
          fields: availableFields.workers.slice(0, 5),
          created_at: new Date(),
        },
      ];
      return mockTemplates;
    },
  });

  const handleDragStart = (field: ReportField) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = () => {
    if (draggedField && !selectedFields.find(f => f.id === draggedField.id)) {
      setSelectedFields([...selectedFields, draggedField]);
    }
    setDraggedField(null);
  };

  const removeField = (fieldId: string) => {
    setSelectedFields(selectedFields.filter(f => f.id !== fieldId));
  };

  const loadTemplate = (template: ReportTemplate) => {
    setSelectedFields(template.fields);
    setReportName(template.name);
    setReportDescription(template.description);
  };

  const saveTemplate = () => {
    if (!reportName || selectedFields.length === 0) {
      alert('Please enter a report name and select at least one field');
      return;
    }

    // In real app, save to API
    console.log('Saving template:', {
      name: reportName,
      description: reportDescription,
      fields: selectedFields,
      schedule: scheduleConfig,
    });

    alert('Template saved successfully!');
    setShowSaveDialog(false);
  };

  const exportReport = async (format: 'csv' | 'json' | 'pdf') => {
    if (selectedFields.length === 0) {
      alert('Please select at least one field to export');
      return;
    }

    // In real app, call API to generate and download report
    console.log('Exporting report:', { format, fields: selectedFields });

    // Mock export logic
    if (format === 'csv') {
      const headers = selectedFields.map(f => f.label).join(',');
      const csv = headers + '\n' + 'Sample,Data,Here,For,Demo';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName || 'report'}.csv`;
      a.click();
    } else if (format === 'json') {
      const data = { fields: selectedFields, data: [] };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName || 'report'}.json`;
      a.click();
    } else if (format === 'pdf') {
      alert('PDF export would be generated here. In production, this would call a backend service to generate the PDF.');
    }
  };

  const scheduleReport = () => {
    if (selectedFields.length === 0) {
      alert('Please select at least one field to schedule');
      return;
    }

    // In real app, save schedule to API
    console.log('Scheduling report:', {
      name: reportName,
      fields: selectedFields,
      schedule: scheduleConfig,
    });

    alert(`Report scheduled ${scheduleConfig.frequency} at ${scheduleConfig.time}`);
    setShowScheduleDialog(false);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'workers':
        return <Users size={16} className="text-blue-600" />;
      case 'time_entries':
        return <Clock size={16} className="text-green-600" />;
      case 'schedules':
        return <Calendar size={16} className="text-purple-600" />;
      case 'fields':
        return <MapPin size={16} className="text-orange-600" />;
      default:
        return <Activity size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Report Builder</h1>
        <p className="text-gray-600 mt-2">
          Create custom reports by dragging and dropping fields
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Available Fields */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow border border-gray-200 p-4 overflow-y-auto max-h-[calc(100vh-250px)]">
          <h2 className="text-lg font-semibold mb-4">Available Fields</h2>

          {Object.entries(availableFields).map(([source, fields]) => (
            <div key={source} className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize flex items-center gap-2">
                {getSourceIcon(source)}
                {source.replace('_', ' ')}
              </h3>
              <div className="space-y-2">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => handleDragStart(field)}
                    className="bg-gray-50 border border-gray-200 rounded p-2 cursor-move hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">{field.label}</div>
                    <div className="text-xs text-gray-500">{field.type}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Main Area - Report Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Configuration */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Report Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Name
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g., Weekly Labor Report"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500"
                />
              </div>
            </div>
          </div>

          {/* Selected Fields */}
          <div
            className="bg-white rounded-lg shadow border border-gray-200 p-6 min-h-[300px]"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <h2 className="text-lg font-semibold mb-4">Selected Fields</h2>
            {selectedFields.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                <FileText size={48} className="mb-2" />
                <p>Drag and drop fields here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">
                        {index + 1}
                      </span>
                      {getSourceIcon(field.source)}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{field.label}</div>
                        <div className="text-xs text-gray-500">
                          {field.source.replace('_', ' ')} - {field.type}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeField(field.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={selectedFields.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-earth-600 text-white rounded-lg hover:bg-earth-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={16} />
              Save Template
            </button>
            <button
              onClick={() => setShowScheduleDialog(true)}
              disabled={selectedFields.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Calendar size={16} />
              Schedule Report
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => exportReport('csv')}
                disabled={selectedFields.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={() => exportReport('json')}
                disabled={selectedFields.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Download size={16} />
                Export JSON
              </button>
              <button
                onClick={() => exportReport('pdf')}
                disabled={selectedFields.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Download size={16} />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Saved Templates */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow border border-gray-200 p-4 overflow-y-auto max-h-[calc(100vh-250px)]">
          <h2 className="text-lg font-semibold mb-4">Saved Templates</h2>
          {templates && templates.length > 0 ? (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-earth-500 cursor-pointer transition-colors"
                  onClick={() => loadTemplate(template)}
                >
                  <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                  <div className="text-xs text-gray-500">
                    {template.fields.length} fields
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No saved templates yet</p>
          )}
        </div>
      </div>

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Report Template</h3>
            <p className="text-sm text-gray-600 mb-4">
              Template will include {selectedFields.length} fields
            </p>
            <div className="flex gap-3">
              <button
                onClick={saveTemplate}
                className="flex-1 px-4 py-2 bg-earth-600 text-white rounded-lg hover:bg-earth-700 transition-colors"
              >
                Save Template
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Report Dialog */}
      {showScheduleDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Schedule Automatic Report</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={scheduleConfig.frequency}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduleConfig.time}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={scheduleReport}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Schedule Report
              </button>
              <button
                onClick={() => setShowScheduleDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
