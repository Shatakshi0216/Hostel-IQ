import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  User, 
  LogOut,
  Sliders,
  HelpCircle,
  Users,
  Flag,
  RefreshCw
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user && (user.role === 'SuperAdmin' || user.role === 'HostelAdmin');

  const activeLinkClass = "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 bg-gradient-to-r from-luxury-indigo/15 to-brand-teal/5 text-white border-l-2 border-luxury-indigo shadow-md shadow-luxury-indigo/5";
  const inactiveLinkClass = "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent transition-all duration-200";

  return (
    <aside className="w-60 bg-slate-950/80 border-r border-white/5 backdrop-blur-xl flex flex-col h-screen shrink-0 relative z-20">
      {/* Brand logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-luxury-indigo via-[#7C3AED] to-brand-teal flex items-center justify-center text-white font-black text-xl shadow-md shadow-luxury-indigo/35">
            H
          </div>
          <div>
            <h1 className="font-display font-black text-white tracking-tight text-sm leading-none">HostelIQ</h1>
            <span className="text-[9px] text-brand-teal font-extrabold tracking-widest uppercase block mt-1">Manager</span>
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-black uppercase text-sm border border-white/10 shadow-sm">
          {user?.name?.charAt(0)}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-extrabold text-white truncate leading-tight">{user?.name}</p>
          <span className="text-[9px] text-brand-teal font-black px-2 py-0.5 rounded-md bg-brand-teal/5 border border-brand-teal/15 inline-block uppercase mt-1">
            {user?.role === 'HostelAdmin' ? 'Warden' : user?.role}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {isAdmin ? (
          <>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Admin Tools</div>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => isActive ? activeLinkClass : inactiveLinkClass}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-luxury-indigo" />
              Overview Dashboard
            </NavLink>
            {user?.role === 'SuperAdmin' && (
              <NavLink
                to="/admin/allocation"
                className={({ isActive }) => isActive ? activeLinkClass : inactiveLinkClass}
              >
                <Sliders className="w-4 h-4 shrink-0 text-brand-teal" />
                Hostel Allocation
              </NavLink>
            )}
          </>
        ) : (
          <>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Student Portal</div>
            <NavLink
              to="/student/dashboard"
              className={({ isActive }) => isActive ? activeLinkClass : inactiveLinkClass}
            >
              <User className="w-4 h-4 shrink-0 text-luxury-indigo" />
              My Allocation
            </NavLink>
            <NavLink
              to="/student/quiz"
              className={({ isActive }) => isActive ? activeLinkClass : inactiveLinkClass}
            >
              <HelpCircle className="w-4 h-4 shrink-0 text-brand-teal" />
              Lifestyle Quiz
            </NavLink>
            <NavLink
              to="/student/preferences"
              className={({ isActive }) => isActive ? activeLinkClass : inactiveLinkClass}
            >
              <Users className="w-4 h-4 shrink-0 text-purple-400" />
              Roommate Preferences
            </NavLink>
            <NavLink
              to="/student/complaints"
              className={({ isActive }) => isActive ? activeLinkClass : inactiveLinkClass}
            >
              <Flag className="w-4 h-4 shrink-0 text-rose-400" />
              Conflict Desk
            </NavLink>
            <NavLink
              to="/student/swap"
              className={({ isActive }) => isActive ? activeLinkClass : inactiveLinkClass}
            >
              <RefreshCw className="w-4 h-4 shrink-0 text-emerald-450" />
              Room Swap Desk
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer Logout */}
      <div className="p-4 border-t border-white/5 bg-slate-950/40">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 border-l-2 border-transparent hover:border-rose-500/50 transition-all duration-200 w-full text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
