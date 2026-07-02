import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import api from '../utils/api';
import {
  Users,
  Building,
  Percent,
  Clock,
  AlertOctagon,
  TrendingUp,
  RefreshCw,
  Sliders,
  Sparkles,
  Bed,
  CheckCircle,
  HelpCircle,
  Award
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Warden visual grid states
  const [activeFloor, setActiveFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // SuperAdmin CGPA editing states
  const [editingCgpas, setEditingCgpas] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // SuperAdmin tab and wardens listing states
  const [adminTab, setAdminTab] = useState('overview');
  const [wardensList, setWardensList] = useState([]);

  const fetchWardens = async () => {
    try {
      const res = await api.get('/auth/wardens');
      if (res.data.success) {
        setWardensList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch wardens list:', err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/allocation/metrics');
      if (res.data.success) {
        setMetrics(res.data.data);
        if (!res.data.data.isWarden) {
          fetchWardens();
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      if (res.data.success) {
        setComplaints(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveComplaint = async (id) => {
    try {
      const res = await api.put(`/complaints/${id}/resolve`);
      if (res.data.success) {
        fetchComplaints();
        fetchMetrics();
        setStatusMessage({ type: 'success', text: 'Complaint marked as resolved successfully!' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to resolve complaint' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleUpdateCgpa = async (hostelId, val) => {
    try {
      const res = await api.put(`/hostels/${hostelId}`, { minCgpa: parseFloat(val) });
      if (res.data.success) {
        fetchMetrics();
        setStatusMessage({ type: 'success', text: 'Hostel minimum CGPA threshold updated successfully!' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to update CGPA threshold' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleUpdateCohorts = async (hostelId, currentCohorts, cohort) => {
    let newCohorts;
    if (currentCohorts.includes(cohort)) {
      newCohorts = currentCohorts.filter(c => c !== cohort);
    } else {
      newCohorts = [...currentCohorts, cohort];
    }
    try {
      const res = await api.put(`/hostels/${hostelId}`, { allowedCohorts: newCohorts });
      if (res.data.success) {
        fetchMetrics();
        setStatusMessage({ type: 'success', text: 'Hostel residing cohorts updated successfully!' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to update residing cohorts' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchComplaints();
  }, []);

  const PIE_COLORS = ['#0EA5E9', '#6366F1', '#10B981'];
  const RISK_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="flex h-screen bg-brand-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Overview Dashboard" />
          <main className="flex-grow p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-400">Loading system metrics...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const kpis = metrics?.kpis || {};
  const charts = metrics?.charts || {};
  const isWarden = metrics?.isWarden || false;

  // Filter students based on search term (Warden dashboard)
  const filteredStudents = (metrics?.studentsList || []).filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.roomNumber.toString().includes(searchTerm)
  );

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Optimized small sync header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-teal" />
            {isWarden ? `Hostel Overview - ${metrics?.hostelName}` : "Overview Dashboard"}
          </h2>
          <button 
            onClick={() => { fetchMetrics(); fetchComplaints(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-650 font-bold uppercase tracking-wider rounded-lg transition"
            title="Sync live server status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Status
          </button>
        </header>

        {!isWarden && (
          <div className="bg-white border-b border-slate-200 px-8 py-3 flex gap-4 shrink-0">
            <button
              onClick={() => setAdminTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                adminTab === 'overview'
                  ? 'bg-slate-100 text-brand-teal shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              Overview & Controls
            </button>
            <button
              onClick={() => setAdminTab('wardens')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                adminTab === 'wardens'
                  ? 'bg-slate-100 text-brand-teal shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              Warden Directory
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {statusMessage.text && (
            <div className={`mb-6 p-4 rounded-xl text-xs font-bold border transition-all duration-300 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-250 text-emerald-600' 
                : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}>
              {statusMessage.type === 'success' ? '✓ ' : '⚠️ '}{statusMessage.text}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
              {error}
            </div>
          )}

          {/* Metric KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Students */}
            <div className="premium-card p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  {isWarden ? 'Hostel Students' : 'Total Students'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1.5">{kpis.totalStudents || 0}</h3>
                <span className="text-xs text-slate-500 mt-2 block font-medium">
                  {isWarden ? 'Currently Allocated' : 'Registered Profiles'}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Total Hostels / Total Rooms */}
            <div className="premium-card p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  {isWarden ? 'Total Rooms' : 'Total Hostels'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1.5">
                  {isWarden ? kpis.totalRooms : kpis.totalHostels || 0}
                </h3>
                <span className="text-xs text-slate-500 mt-2 block font-medium">
                  {isWarden ? 'Layout Rooms' : 'Gender Segregated'}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                <Building className="w-5 h-5" />
              </div>
            </div>

            {/* Occupancy Rate */}
            <div className="premium-card p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  {isWarden ? 'Beds Occupancy' : 'Occupancy Rate'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1.5">{kpis.occupancyRate || 0}%</h3>
                <div className="w-24 bg-slate-100 border border-slate-200 rounded-full h-2 mt-2.5 overflow-hidden">
                  <div 
                    className="bg-brand-teal h-full rounded-full" 
                    style={{ width: `${Math.min(100, kpis.occupancyRate || 0)}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-brand-teal">
                <Percent className="w-5 h-5" />
              </div>
            </div>

            {/* Waitlist Queue / Active Conflicts */}
            <div className="premium-card p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  {isWarden ? 'Active Conflicts' : 'Waitlist Count'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1.5">
                  {isWarden ? kpis.openComplaintsCount : kpis.waitlistCount || 0}
                </h3>
                <span className="text-xs text-slate-500 mt-2 block flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-brand-warning shrink-0" />
                  {isWarden ? 'Needs Resolution' : `${kpis.openComplaintsCount || 0} Open Conflicts`}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-brand-warning">
                <AlertOctagon className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Residing Bracket (Warden Scoped) */}
          {isWarden && (
            <div className="premium-card p-5 mb-8 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hostel Academic Cohorts</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Residing batches: <span className="text-brand-teal font-black">{metrics?.residingYears}</span>
                </p>
              </div>
            </div>
          )}

          {/* SuperAdmin View: Hostel CGPA & Placement Controls */}
          {!isWarden && adminTab === 'overview' && (
            <div className="premium-card p-6 mb-8">
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-800">Hostel Placement & CGPA Control Board</h4>
                <p className="text-xs text-slate-400 mt-0.5">Control minimum CGPA criteria per hostel and view active allocations</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pl-2">Hostel Name</th>
                      <th className="pb-3">Gender Restriction</th>
                      <th className="pb-3">Allocated Students</th>
                      <th className="pb-3">Resident Avg CGPA</th>
                      <th className="pb-3">Allowed Cohorts (SuperAdmin)</th>
                      <th className="pb-3 pr-2 text-right">CGPA Threshold (SuperAdmin Only)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(metrics?.hostelsList || []).map((h) => {
                      const currentVal = editingCgpas[h._id] !== undefined ? editingCgpas[h._id] : h.minCgpa;
                      return (
                        <tr key={h._id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 pl-2 font-bold text-slate-900">{h.name}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              h.genderRestriction === 'Boys' 
                                ? 'bg-sky-50 text-sky-600 border border-sky-100' 
                                : 'bg-pink-50 text-pink-600 border border-pink-100'
                            }`}>
                              {h.genderRestriction}
                            </span>
                          </td>
                          <td className="py-4 font-semibold">
                            {h.occupiedCount} / {h.calculatedCapacity}
                            <span className="text-[10px] text-slate-400 font-medium ml-1">({Math.round((h.occupiedCount / h.calculatedCapacity) * 100)}% Full)</span>
                          </td>
                          <td className="py-4 font-bold text-emerald-600">{h.avgCgpa > 0 ? `${h.avgCgpa} CGPA` : 'N/A'}</td>
                          <td className="py-4">
                            <div className="grid grid-cols-2 gap-1.5 max-w-[200px]">
                              {['BTech 1', 'BTech 2', 'BTech 3', 'BTech 4', 'MTech', 'MCA', 'PhD'].map(cohort => {
                                const isChecked = h.allowedCohorts && h.allowedCohorts.includes(cohort);
                                return (
                                  <label key={cohort} className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 cursor-pointer hover:text-slate-900 select-none">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleUpdateCohorts(h._id, h.allowedCohorts || [], cohort)}
                                      className="w-3 h-3 rounded border-slate-350 text-brand-teal focus:ring-brand-teal cursor-pointer accent-brand-teal"
                                    />
                                    <span>{cohort}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-4 pr-2 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <span className="text-[10px] font-bold text-slate-500">Min:</span>
                              <input 
                                type="number" 
                                step="0.1" 
                                min="0" 
                                max="10" 
                                value={currentVal}
                                onChange={(e) => handleCgpaChange(h._id, e.target.value)}
                                className="w-16 text-center premium-input text-xs font-bold py-1 px-1.5"
                              />
                              <button 
                                onClick={() => handleUpdateCgpa(h._id, currentVal)}
                                className="px-2.5 py-1 bg-brand-teal hover:bg-teal-650 text-white rounded font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SuperAdmin View: Warden Management Directory */}
          {!isWarden && adminTab === 'wardens' && (
            <div className="premium-card p-6 mb-8 animate-in fade-in duration-200">
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-800">Warden Management Directory</h4>
                <p className="text-xs text-slate-400 mt-0.5">List of all 15 university warden records, phone numbers, and associated hostels</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pl-2">Warden Name</th>
                      <th className="pb-3">Email Address</th>
                      <th className="pb-3">Phone Number</th>
                      <th className="pb-3 pr-2">Assigned Hostel Block</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {wardensList.length > 0 ? (
                      wardensList.map((w) => (
                        <tr key={w._id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 pl-2 font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-black text-xs">
                              {w.name.charAt(0) || 'W'}
                            </span>
                            {w.name}
                          </td>
                          <td className="py-4 font-semibold text-slate-500">{w.email}</td>
                          <td className="py-4 font-bold text-slate-700">{w.phone || 'N/A'}</td>
                          <td className="py-4 pr-2 font-semibold">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                              {w.managedHostelId?.name || 'Unassigned'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 font-semibold">No wardens found. Run seeder to seed accounts.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warden View: Visual Room Ticket Booking Grid */}
          {isWarden && (
            <div className="premium-card p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Visual Room Layout & Occupancy Map</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Click any room seat to inspect residents and roommate details</p>
                </div>
                
                {/* Floor tabs */}
                <div className="flex gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-lg self-start">
                  {[1, 2, 3, 4].map(fl => (
                    <button
                      key={fl}
                      onClick={() => setActiveFloor(fl)}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                        activeFloor === fl 
                          ? 'bg-white text-brand-teal shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Floor {fl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Coding Legends */}
              <div className="flex gap-4 mb-6 pb-4 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600"></div>
                  <span>Empty Room (Green)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-amber-400 border border-amber-500"></div>
                  <span>Partially Filled (Yellow)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-600"></div>
                  <span>Fully Occupied (Red)</span>
                </div>
              </div>

              {/* Room grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-4">
                {(metrics?.roomsList || [])
                  .filter(r => r.floor === activeFloor)
                  .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }))
                  .map(room => {
                    let btnColor = 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600';
                    if (room.state === 'partial') {
                      btnColor = 'bg-amber-400 hover:bg-amber-500 text-slate-900 border border-amber-500';
                    } else if (room.state === 'full') {
                      btnColor = 'bg-rose-500 hover:bg-rose-600 text-white border border-rose-600';
                    }

                    return (
                      <button
                        key={room._id}
                        onClick={() => setSelectedRoom(room)}
                        className={`flex flex-col items-center justify-between p-2.5 rounded-xl cursor-pointer font-bold shadow-sm hover:shadow transition-all duration-150 transform hover:-translate-y-0.5 ${btnColor}`}
                      >
                        <span className="text-[10px] tracking-widest uppercase opacity-75">Room</span>
                        <span className="text-sm font-black mt-0.5">{room.roomNumber}</span>
                        <div className="flex items-center gap-0.5 mt-1.5 text-[9px] font-black uppercase tracking-wider px-1 py-0.5 bg-black/10 rounded">
                          <Bed className="w-2.5 h-2.5" />
                          <span>{room.occupantsCount}/{room.capacity}</span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Popup Modal for Selected Room */}
          {selectedRoom && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer font-bold text-lg"
                >
                  ✕
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal">
                    <Bed className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      Room {selectedRoom.roomNumber} Occupancy
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Floor {selectedRoom.floor} • Capacity {selectedRoom.capacity} Beds ({selectedRoom.occupantsCount} Residing)
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                    Resident Students
                  </h4>

                  {selectedRoom.occupants.length > 0 ? (
                    selectedRoom.occupants.map((student, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-800 text-xs">{student.name}</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                            Year {student.academicYear}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{student.email}</p>
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/50 text-[10px]">
                          <div>
                            <span className="text-slate-400 block font-semibold">Branch</span>
                            <span className="text-slate-700 font-bold">{student.branch}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold">Academic CGPA</span>
                            <span className="text-brand-teal font-black">{student.cgpa}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400 font-semibold text-xs">
                      Room is currently vacant.
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={() => setSelectedRoom(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Close Layout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pie Charts Slices Grid (No Room Bar Graphs) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Allocation Status (Pie) */}
            <div className="premium-card p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  {isWarden ? 'Bed Occupancy Status' : 'Allocation Status'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isWarden ? 'Proportion of occupied beds' : 'Proportion of student placement'}
                </p>
              </div>
              
              <div className="h-56 relative flex items-center justify-center bg-slate-50/50 rounded-xl mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.allocationDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(charts.allocationDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#1E293B' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Dynamic Inner Text */}
                <div className="absolute text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    {isWarden ? 'Beds Occupied' : 'Total Assigned'}
                  </span>
                  <span className="text-2xl font-black text-slate-800 block mt-0.5">
                    {isWarden ? (kpis.totalStudents || 0) : (kpis.totalOccupied || 0)}
                  </span>
                </div>
              </div>

              {/* Legends list */}
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                {(charts.allocationDistribution || []).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                      <span>{item.name}</span>
                    </div>
                    <span className="text-slate-800 font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic Year Dist (Pie) */}
            <div className="premium-card p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Academic Year Cohorts</h4>
                <p className="text-xs text-slate-400 mt-0.5">Placement breakdown by year level</p>
              </div>
              
              <div className="h-56 relative flex items-center justify-center bg-slate-50/50 rounded-xl mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.yearDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(charts.yearDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#1E293B' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                {(charts.yearDistribution || []).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                      <span>{item.name}</span>
                    </div>
                    <span className="text-slate-800 font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conflict Risks breakdown (Pie) */}
            <div className="premium-card p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Student Conflict Risk Profile</h4>
                <p className="text-xs text-slate-400 mt-0.5">Aggregated roommate suitability indexes</p>
              </div>
              
              <div className="h-56 relative flex items-center justify-center bg-slate-50/50 rounded-xl mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.conflictRiskDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(charts.conflictRiskDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#1E293B' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                {(charts.conflictRiskDistribution || []).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[index % RISK_COLORS.length] }}></div>
                      <span>{item.name}</span>
                    </div>
                    <span className="text-slate-800 font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Warden Scoped: Student List & Complaints Section */}
          {isWarden && (
            <div className="space-y-8">
              {/* Student Directory Card */}
              <div className="premium-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Student Room Directory</h4>
                    <p className="text-xs text-slate-400 mt-0.5">All students currently allocated to your hostel block</p>
                  </div>
                  <div className="w-full sm:w-64">
                    <input 
                      type="text" 
                      placeholder="Search by student name or room..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="premium-input text-xs w-full"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 pl-2">Student</th>
                        <th className="pb-3">Room</th>
                        <th className="pb-3">Roommates</th>
                        <th className="pb-3">Academic Year</th>
                        <th className="pb-3">Branch</th>
                        <th className="pb-3">CGPA</th>
                        <th className="pb-3 pr-2 text-right">Priority Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="py-3.5 pl-2">
                              <span className="font-bold text-slate-800 block">{s.name}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5 block">{s.email}</span>
                            </td>
                            <td className="py-3.5 font-bold text-brand-teal">Room {s.roomNumber}</td>
                            <td className="py-3.5 text-slate-500 font-medium max-w-xs truncate">{s.roommates}</td>
                            <td className="py-3.5 font-semibold">Year {s.academicYear}</td>
                            <td className="py-3.5 font-semibold text-slate-650">{s.branch}</td>
                            <td className="py-3.5 font-semibold">{s.cgpa}</td>
                            <td className="py-3.5 pr-2 font-black text-slate-900 text-right">{s.priorityScore}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">No students found matching filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Complaints Resolution Center */}
              <div className="premium-card p-6">
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-800">Complaints Log</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Complaints filed by or against students inside your hostel block</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 pl-2">Reporter</th>
                        <th className="pb-3">Accused Student</th>
                        <th className="pb-3">Conflict Type</th>
                        <th className="pb-3">Severity</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 pr-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {complaints.length > 0 ? (
                        complaints.map((c) => (
                          <tr key={c._id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3.5 pl-2 font-semibold">
                              {c.reporterId?.name || 'Unknown'}
                              <span className="text-[10px] text-slate-400 block mt-0.5">{c.reporterId?.email}</span>
                            </td>
                            <td className="py-3.5 font-semibold">
                              {c.accusedId?.name || 'Unknown'}
                              <span className="text-[10px] text-slate-400 block mt-0.5">{c.accusedId?.email}</span>
                            </td>
                            <td className="py-3.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                {c.type}
                              </span>
                            </td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.severity === 'High' 
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                                  : c.severity === 'Medium'
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              }`}>
                                {c.severity} Severity
                              </span>
                            </td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                c.status === 'Resolved'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-600 border border-amber-200'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3.5 pr-2 text-right">
                              {c.status === 'Open' ? (
                                <button
                                  onClick={() => handleResolveComplaint(c._id)}
                                  className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold text-[10px] uppercase tracking-wider cursor-pointer shadow-sm hover:shadow transition"
                                >
                                  Mark Resolved
                                </button>
                              ) : (
                                <span className="text-slate-400 font-semibold text-[10px]">No Actions Pending</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">No complaints registered in this block.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );

  function handleCgpaChange(hostelId, val) {
    setEditingCgpas(prev => ({
      ...prev,
      [hostelId]: val
    }));
  }
};

export default AdminDashboard;
