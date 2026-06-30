import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, ShieldCheck } from 'lucide-react';

const Header = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer">
          <Bell className="w-4 h-4" />
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800 leading-none">{user?.name}</p>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{user?.email}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-tealLight flex items-center justify-center text-brand-teal">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
