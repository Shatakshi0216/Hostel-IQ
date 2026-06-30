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
    <aside className="w-60 bg-slate-900 flex flex-col h-screen shrink-0 border-r border-slate-800">
      {/* Brand logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center text-white font-black text-lg">
            H
          </div>
          <div>
            <h1 className="font-extrabold text-white tracking-tight text-sm leading-none">HostelIQ</h1>
            <span className="text-[9px] text-brand-teal font-bold tracking-widest uppercase block mt-0.5">Manager</span>
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/20">
        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-white font-bold uppercase text-sm border border-slate-700">
          {user?.name?.charAt(0)}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
          <span className="text-[9px] text-slate-400 font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 inline-block uppercase mt-0.5">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {isAdmin ? (
          <>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Admin Tools</div>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              Overview Dashboard
            </NavLink>
            {user?.role === 'SuperAdmin' && (
              <NavLink
                to="/admin/allocation"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                  }`
                }
              >
                <Sliders className="w-4 h-4 shrink-0" />
                Hostel Allocation
              </NavLink>
            )}
          </>
        ) : (
          <>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Student Portal</div>
            <NavLink
              to="/student/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`
              }
            >
              <User className="w-4 h-4 shrink-0" />
              My Allocation
            </NavLink>
            <NavLink
              to="/student/quiz"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`
              }
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              Lifestyle Quiz
            </NavLink>
            <NavLink
              to="/student/preferences"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`
              }
            >
              <Users className="w-4 h-4 shrink-0" />
              Roommate Preferences
            </NavLink>
            <NavLink
              to="/student/complaints"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`
              }
            >
              <Flag className="w-4 h-4 shrink-0" />
              Conflict Desk
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-800 hover:text-white text-slate-400 transition-all duration-150 w-full text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
