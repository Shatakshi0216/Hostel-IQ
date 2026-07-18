import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, ShieldCheck } from 'lucide-react';

const Header = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-slate-950/40 border-b border-white/5 backdrop-blur-md flex items-center justify-between px-8 shrink-0 relative z-10">
      <div>
        <h2 className="text-sm font-black text-white uppercase tracking-wider">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200 cursor-pointer relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-teal animate-ping" />
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-3 border-l border-white/10 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-extrabold text-white leading-none">{user?.name}</p>
            <span className="text-[9px] text-slate-450 font-bold block mt-1">{user?.email}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-luxury-indigo to-brand-teal flex items-center justify-center text-white shadow-sm shadow-luxury-indigo/15">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
