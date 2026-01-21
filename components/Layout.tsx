
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Discovery Feed', path: '/', icon: '🔍' },
    { name: 'Workspace', path: '/workspace', icon: '📝' },
    { name: 'Profile', path: '/profile', icon: '👤' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <nav className="w-full md:w-64 bg-white border-b md:border-r border-slate-200 p-4 sticky top-0 md:h-screen z-10">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">J</div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            JobSentry
          </h1>
        </div>
        
        <div className="flex md:flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden md:block mt-auto p-4 bg-slate-100 rounded-xl">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Sentry Status</p>
          <div className="flex items-center gap-2 text-xs text-green-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Watching 24/7
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
          </h2>
          <div className="text-sm text-slate-400">
            v1.0.2-prod
          </div>
        </header>
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
