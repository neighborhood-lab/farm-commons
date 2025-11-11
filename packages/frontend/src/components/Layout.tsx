import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Users, Calendar, Clock, Home, LogOut, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import ThemeToggle from './ThemeToggle';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Workers', href: '/workers', icon: Users },
    { name: 'Fields', href: '/fields', icon: MapPin },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Time Tracking', href: '/time-tracking', icon: Clock },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-earth-800 dark:bg-earth-900 text-white">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-earth-700 dark:border-earth-800">
            <h1 className="text-2xl font-bold">🚜 Farm Commons</h1>
            <p className="text-earth-300 dark:text-earth-400 text-sm mt-1">
              Community owned
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-earth-700 dark:bg-earth-800 text-white'
                      : 'text-earth-300 dark:text-earth-400 hover:bg-earth-700/50 dark:hover:bg-earth-800/50 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-earth-700 dark:border-earth-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-earth-400 dark:text-earth-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-earth-700 dark:hover:bg-earth-800 transition-colors flex-shrink-0"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
