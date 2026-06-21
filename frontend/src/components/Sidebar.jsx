import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  Settings, 
  User, 
  AlertTriangle, 
  LogOut,
  Sliders,
  HelpCircle,
  Users,
  Flag
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user && (user.role === 'SuperAdmin' || user.role === 'HostelAdmin');

  return (
    <aside className="w-60 bg-brand-dark text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800">
      {/* Brand logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center text-white font-bold text-lg">
            H
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight text-base leading-none">HostelIQ</h1>
            <span className="text-[10px] text-brand-teal font-medium tracking-wider uppercase">Enterprise</span>
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold uppercase">
          {user?.name?.charAt(0)}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
          <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 inline-block uppercase">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        {isAdmin ? (
          <>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Admin Tools</div>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-4 border-brand-teal pl-2'
                    : 'hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              Overview Dashboard
            </NavLink>
            <NavLink
              to="/admin/allocation"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-4 border-brand-teal pl-2'
                    : 'hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              <Sliders className="w-4 h-4 text-slate-400" />
              Allocation Engine
            </NavLink>
          </>
        ) : (
          <>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Student Portal</div>
            <NavLink
              to="/student/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-4 border-brand-teal pl-2'
                    : 'hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              <User className="w-4 h-4 text-slate-400" />
              My Allocation
            </NavLink>
            <NavLink
              to="/student/quiz"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-4 border-brand-teal pl-2'
                    : 'hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              Lifestyle Quiz
            </NavLink>
            <NavLink
              to="/student/preferences"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-4 border-brand-teal pl-2'
                    : 'hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              <Users className="w-4 h-4 text-slate-400" />
              Roommate Choices
            </NavLink>
            <NavLink
              to="/student/complaints"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-4 border-brand-teal pl-2'
                    : 'hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              <Flag className="w-4 h-4 text-slate-400" />
              Conflict Desk
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-rose-950/30 hover:text-rose-400 transition-all w-full text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
