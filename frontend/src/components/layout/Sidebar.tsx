import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  UserCheck,
  ShieldAlert,
  LogOut,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'My Tasks', path: '/my-tasks', icon: CheckSquare },
    { label: 'Profile', path: '/profile', icon: UserCheck },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ label: 'Admin Portal', path: '/admin', icon: ShieldAlert });
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 w-64 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
        <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <span className="font-bold text-lg text-white tracking-tight">TaskPulse</span>
          <span className="block text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">
            Issue Tracker
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <Badge
            variant={user?.role === 'ADMIN' ? 'default' : 'secondary'}
            className="text-[10px] px-2 py-0.5 ml-2"
          >
            {user?.role}
          </Badge>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 rounded-lg border border-rose-900/40 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
