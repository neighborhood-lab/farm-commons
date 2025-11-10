import { useState, useEffect } from 'react';
import { Plus, X, Clock, Calendar, ClipboardList, Keyboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  shortcut?: string;
  description?: string;
}

export default function QuickActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const quickActions: QuickAction[] = [
    {
      id: 'clock-in-out',
      label: 'Clock In/Out',
      icon: <Clock size={20} />,
      onClick: () => {
        navigate('/time-tracking');
        setIsOpen(false);
      },
      shortcut: 'Alt+C',
      description: 'Navigate to time tracking page',
    },
    {
      id: 'create-schedule',
      label: 'Create Schedule',
      icon: <Calendar size={20} />,
      onClick: () => {
        navigate('/schedule');
        setIsOpen(false);
      },
      shortcut: 'Alt+S',
      description: 'Navigate to schedule page',
    },
    {
      id: 'add-time-entry',
      label: 'Add Time Entry',
      icon: <ClipboardList size={20} />,
      onClick: () => {
        navigate('/time-tracking');
        setIsOpen(false);
      },
      shortcut: 'Alt+T',
      description: 'Navigate to time entries',
    },
    {
      id: 'keyboard-shortcuts',
      label: 'Keyboard Shortcuts',
      icon: <Keyboard size={20} />,
      onClick: () => {
        setShowShortcuts(true);
        setIsOpen(false);
      },
      shortcut: 'Alt+K',
      description: 'View all keyboard shortcuts',
    },
  ];

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+Q to toggle menu
      if (event.altKey && event.key.toLowerCase() === 'q') {
        event.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // Alt+C for Clock In/Out
      if (event.altKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        navigate('/time-tracking');
        setIsOpen(false);
        return;
      }

      // Alt+S for Schedule
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        navigate('/schedule');
        setIsOpen(false);
        return;
      }

      // Alt+T for Time Entry
      if (event.altKey && event.key.toLowerCase() === 't') {
        event.preventDefault();
        navigate('/time-tracking');
        setIsOpen(false);
        return;
      }

      // Alt+K for Keyboard Shortcuts
      if (event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowShortcuts(true);
        setIsOpen(false);
        return;
      }

      // Alt+D for Dashboard
      if (event.altKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        navigate('/');
        setIsOpen(false);
        return;
      }

      // Alt+W for Workers
      if (event.altKey && event.key.toLowerCase() === 'w') {
        event.preventDefault();
        navigate('/workers');
        setIsOpen(false);
        return;
      }

      // Escape to close menu
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.quick-actions-menu')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* Floating Action Button */}
      <div className="quick-actions-menu fixed bottom-8 right-8 z-50">
        {/* Action Buttons */}
        {isOpen && (
          <div className="mb-4 space-y-3 animate-fade-in">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className="group flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-900 px-4 py-3 rounded-lg shadow-lg border border-gray-200 transition-all hover:shadow-xl hover:scale-105 min-w-[200px]"
                title={action.description}
              >
                <div className="bg-earth-700 text-white p-2 rounded-lg group-hover:bg-earth-800 transition-colors">
                  {action.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{action.label}</p>
                  {action.shortcut && (
                    <p className="text-xs text-gray-500">{action.shortcut}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`${
            isOpen
              ? 'bg-red-600 hover:bg-red-700 rotate-45'
              : 'bg-earth-700 hover:bg-earth-800'
          } text-white p-4 rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-110 flex items-center justify-center`}
          aria-label="Quick Actions Menu"
          title={isOpen ? 'Close Menu (Esc)' : 'Quick Actions (Alt+Q)'}
        >
          {isOpen ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Navigation Shortcuts */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Navigation</h3>
                  <div className="space-y-2">
                    <ShortcutItem shortcut="Alt+D" description="Go to Dashboard" />
                    <ShortcutItem shortcut="Alt+W" description="Go to Workers" />
                    <ShortcutItem shortcut="Alt+S" description="Go to Schedule" />
                    <ShortcutItem shortcut="Alt+C" description="Go to Time Tracking" />
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <ShortcutItem shortcut="Alt+Q" description="Toggle Quick Actions Menu" />
                    <ShortcutItem shortcut="Alt+T" description="Add Time Entry" />
                    <ShortcutItem shortcut="Alt+K" description="Show Keyboard Shortcuts" />
                  </div>
                </div>

                {/* General */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">General</h3>
                  <div className="space-y-2">
                    <ShortcutItem shortcut="Esc" description="Close Modal/Menu" />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> All shortcuts use the <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Alt</kbd> key as the modifier.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowShortcuts(false)}
                className="w-full bg-earth-700 hover:bg-earth-800 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShortcutItem({ shortcut, description }: { shortcut: string; description: string }) {
  const keys = shortcut.split('+');

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50">
      <span className="text-sm text-gray-700">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index} className="flex items-center">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono font-semibold">
              {key}
            </kbd>
            {index < keys.length - 1 && <span className="mx-1 text-gray-400">+</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
