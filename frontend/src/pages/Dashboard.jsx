import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Utensils, Dumbbell, Package, AlertCircle, LogOut, Shield, GraduationCap } from 'lucide-react';

export default function Dashboard({ onLogout, isAdmin }) {
  const navigate = useNavigate();
  const name = localStorage.getItem('name') || 'Student';

  const modules = [
    {
      title: 'Mess Management',
      description: "View today's menu and submit feedback on food quality",
      icon: Utensils,
      color: 'from-orange-400 to-rose-500',
      path: '/mess',
      testId: 'module-mess'
    },
    {
      title: 'Sports Equipment',
      description: 'Check availability and book sports equipment in real-time',
      icon: Dumbbell,
      color: 'from-blue-400 to-cyan-500',
      path: '/sports',
      testId: 'module-sports'
    },
    {
      title: 'Lost & Found',
      description: 'Report lost items or help others find their belongings',
      icon: Package,
      color: 'from-purple-400 to-pink-500',
      path: '/lost-found',
      testId: 'module-lost-found'
    },
    {
      title: 'Report Issues',
      description: 'Submit complaints about waste management or maintenance',
      icon: AlertCircle,
      color: 'from-green-400 to-teal-500',
      path: '/complaints',
      testId: 'module-complaints'
    },
  ];

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-2 rounded-xl">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Campus Catalyst</h1>
                <p className="text-xs text-gray-600">Smart Campus Companion</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                <p className="text-xs text-gray-600">{isAdmin ? 'Administrator' : 'Student'}</p>
              </div>
              {isAdmin && (
                <Button
                  data-testid="admin-panel-button"
                  onClick={() => navigate('/admin')}
                  variant="outline"
                  className="gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Button>
              )}
              <Button
                data-testid="logout-button"
                onClick={handleLogout}
                variant="outline"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12 text-center fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Welcome, {name.split(' ')[0]}!
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            What would you like to do today? Choose from our smart campus services below.
          </p>
        </div>

        {/* Module Cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <div
                key={index}
                data-testid={module.testId}
                onClick={() => navigate(module.path)}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 cursor-pointer card-hover fade-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-6">
                  <div className={`bg-gradient-to-br ${module.color} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {module.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-100 p-8 fade-in">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Info</h3>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
              <p className="text-3xl font-bold text-teal-600 mb-1">4</p>
              <p className="text-sm text-gray-700 font-medium">Active Modules</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <p className="text-3xl font-bold text-blue-600 mb-1">24/7</p>
              <p className="text-sm text-gray-700 font-medium">Service Availability</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <p className="text-3xl font-bold text-purple-600 mb-1">IIIT</p>
              <p className="text-sm text-gray-700 font-medium">Campus Wide Access</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}