import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu, title = 'TaskPulse' }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200/80 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-sm shadow-xs border border-indigo-200">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-sm font-semibold text-gray-800 leading-tight">
              {user?.name}
            </span>
            <span className="text-xs text-gray-500">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
