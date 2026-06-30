import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../utils/api';
import { Building2, FlameKindling, CheckCircle, AlertTriangle, Users } from 'lucide-react';

const StudentDashboard = () => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/matching/details');
      if (res.data.success) {
        setDetails(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to sync student allocation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-brand-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="My Allocation" />
          <main className="flex-grow p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Loading allocation profile...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const profile = details?.profile || {};
  const roommates = details?.roommates || [];
  const risk = details?.conflictRisk || { score: 0, category: 'Low Risk' };

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="My Allocation" />

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {error && (
            <div className="mb-6 p-4.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Allocation Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="premium-card p-6 md:col-span-2 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-brand-tealLight flex items-center justify-center text-brand-teal shrink-0">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Hostel Assignment</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {profile.allocatedHostelId?.name || 'Unassigned'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                  {profile.status === 'Allocated' && profile.allocatedRoomId 
                    ? `Block: ${profile.allocatedRoomId.block} — Room: ${profile.allocatedRoomId.roomNumber} (${profile.allocatedRoomId.capacity}-sharing)`
                    : profile.status === 'Waitlisted'
                    ? 'Your hostel allocation is currently waitlisted due to capacity.'
                    : 'The administration has not executed the matching rules engine.'}
                </p>
              </div>
            </div>

            <div className="premium-card p-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Allocation Status</span>
                <div className="mt-3">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                    profile.status === 'Allocated'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : profile.status === 'Waitlisted'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {profile.status}
                    {profile.status === 'Waitlisted' && ` (Position: #${profile.waitlistPosition})`}
                  </span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <FlameKindling className="w-4 h-4 text-rose-500" />
                  Conflict Risk:
                </span>
                <strong className={`font-bold uppercase ${
                  risk.category === 'High Risk' ? 'text-rose-600' : risk.category === 'Medium Risk' ? 'text-amber-600' : 'text-emerald-600'
                }`}>{risk.category}</strong>
              </div>
            </div>
          </div>

          {/* Roommates List */}
          {profile.status === 'Allocated' && (
            <div className="premium-card overflow-hidden">
              <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Room Occupants</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Students sharing Room {profile.allocatedRoomId?.roomNumber}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5 text-brand-teal" />
                  Target Occupancy: {profile.allocatedRoomId?.capacity}
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {roommates.map(rm => (
                  <div key={rm._id} className="p-5 border border-slate-200 rounded-xl bg-slate-50/30 flex flex-col justify-between hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-bold text-slate-800 block">{rm.name}</span>
                        <span className="text-xs text-slate-500 font-medium block mt-0.5">{rm.email}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        rm.preferenceStatus === 'Mutual Match'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {rm.preferenceStatus}
                      </span>
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Matching compatibility:</span>
                      <span className="text-sm font-black text-brand-teal">{rm.compatibilityScore}%</span>
                    </div>
                  </div>
                ))}
                {roommates.length === 0 && (
                  <div className="col-span-2 py-10 text-center text-slate-400 text-xs font-medium bg-white rounded-xl border border-dashed border-slate-200">
                    You currently have no roommates matched in this room (Single occupancy room).
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
