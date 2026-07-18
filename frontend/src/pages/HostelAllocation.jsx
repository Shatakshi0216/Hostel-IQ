import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import api from '../utils/api';
import { Play, CheckCircle, AlertTriangle, ShieldCheck, Trash2 } from 'lucide-react';

const HostelAllocation = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [hostelsList, setHostelsList] = useState([]);
  const [changedPlacements, setChangedPlacements] = useState({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [engineLoading, setEngineLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('Boys'); // 'Boys' or 'Girls'

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [minCgpa, setMinCgpa] = useState(0);

  const fetchData = async () => {
    try {
      const [studentsRes, hostelsRes] = await Promise.all([
        api.get('/allocation/rankings'),
        api.get('/hostels')
      ]);
      
      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data);
      }
      if (hostelsRes.data.success) {
        setHostelsList(hostelsRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load student rankings and hostel list' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnallocateAll = () => {
    setShowResetConfirm(true);
  };

  const submitUnallocateAll = async () => {
    setShowResetConfirm(false);
    setMessage({ type: '', text: '' });
    setEngineLoading(true);
    try {
      const res = await api.post('/allocation/unallocate');
      if (res.data.success) {
        setMessage({ type: 'success', text: 'All student allocations have been cleared successfully.' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to clear allocations.' });
    } finally {
      setEngineLoading(false);
    }
  };

  const handlePlacementDropdownChange = (studentId, value) => {
    setChangedPlacements(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleCancelPlacementChange = (studentId) => {
    setChangedPlacements(prev => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const handleManualAllocateStudent = async (studentId, allocatedHostelId) => {
    setMessage({ type: '', text: '' });
    setEngineLoading(true);
    try {
      const res = await api.put(`/allocation/student/${studentId}`, { allocatedHostelId });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Student hostel placement updated successfully.' });
        setChangedPlacements(prev => {
          const next = { ...prev };
          delete next[studentId];
          return next;
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update student placement.' });
    } finally {
      setEngineLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunAllocation = async () => {
    setMessage({ type: '', text: '' });
    setEngineLoading(true);

    try {
      // Step 1: Run Hostel Allocation Engine
      const hostelRes = await api.post('/allocation/run');
      
      if (hostelRes.data.success) {
        setMessage({
          type: 'success',
          text: `Hostel allocation completed! Assigned: ${hostelRes.data.allocatedCount} students, Waitlisted: ${hostelRes.data.waitlistCount} students. Room and roommate pairing must be executed by each hostel's Warden.`,
        });
        
        // Refresh rankings list preview
        const rankRes = await api.get('/allocation/rankings');
        setStudents(rankRes.data.data);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Allocation Engine error occurred' });
    } finally {
      setEngineLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-brand-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Hostel Allocation Engine" />
          <main className="flex-grow p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Loading configurations Preview...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Hostel Allocation Engine" />

        <main className="flex-1 overflow-y-auto p-8 bg-transparent">
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl text-xs font-bold border flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Orchestrator Header Banner */}
          <div className="premium-card p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-teal/10 border border-brand-teal/15 flex items-center justify-center text-brand-teal shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Match Orchestrator</h4>
                <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
                  Automate university-wide hostel placements and room assignments. The system computes priority scores (ranking CGPA, regional contributions, academic year brackets, and special status) and maps roommates using graph compatibility matching.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                onClick={handleUnallocateAll}
                disabled={engineLoading}
                className="btn-secondary py-3 px-4 flex items-center justify-center gap-2 border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/10 text-rose-400"
              >
                <Trash2 className="w-4 h-4" />
                Unallocate All
              </button>
              <button
                onClick={handleRunAllocation}
                disabled={engineLoading}
                className="btn-primary py-3 px-6 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed font-bold tracking-wider text-xs uppercase"
              >
                {engineLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Allocations...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Execute Match Engines
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Student Rankings preview */}
          <div className="premium-card overflow-hidden">
            <div className="px-6 py-4.5 border-b border-white/5 bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Calculated Student Rankings</h4>
                <p className="text-xs text-slate-400 mt-0.5">Ranked by Priority Score based on university allocation rules</p>
              </div>

              {/* Gender Tabs */}
              <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveTab('Boys')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                    activeTab === 'Boys'
                      ? 'bg-gradient-to-r from-luxury-indigo to-brand-teal text-white shadow-md border border-white/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Boys Section (B1)
                </button>
                <button
                  onClick={() => setActiveTab('Girls')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                    activeTab === 'Girls'
                      ? 'bg-gradient-to-r from-luxury-indigo to-brand-teal text-white shadow-md border border-white/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Girls Section (G1)
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 bg-white/[0.01] border-b border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Search Student</label>
                <input
                  type="text"
                  placeholder="Name or Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="premium-input py-1.5 text-xs bg-slate-900/40"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Branch</label>
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="premium-input py-1.5 text-xs bg-slate-900/40 text-white cursor-pointer"
                >
                  <option value="All" className="bg-slate-950">All Branches</option>
                  {['CSE', 'ECE', 'MDS', 'Electrical', 'Mech', 'Civil', 'Chemical', 'MME'].map(br => (
                    <option key={br} value={br} className="bg-slate-950">{br}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Academic Cohort</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="premium-input py-1.5 text-xs bg-slate-900/40 text-white cursor-pointer"
                >
                  <option value="All" className="bg-slate-950">All Cohorts</option>
                  {['BTech 1', 'BTech 2', 'BTech 3', 'BTech 4', 'MTech', 'MCA', 'PhD'].map(c => (
                    <option key={c} value={c} className="bg-slate-950">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="premium-input py-1.5 text-xs bg-slate-900/40 text-white cursor-pointer"
                >
                  <option value="All" className="bg-slate-950">All Statuses</option>
                  <option value="Allocated" className="bg-slate-950">Allocated</option>
                  <option value="Waitlisted" className="bg-slate-950">Waitlisted</option>
                  <option value="Unallocated" className="bg-slate-950">Unallocated</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Min CGPA ({minCgpa})</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-teal mt-3.5"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">CGPA</th>
                    <th className="px-6 py-4">Branch</th>
                    <th className="px-6 py-4">Year</th>
                    <th className="px-6 py-4">Hostel Placement</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {students
                    .filter(student => {
                      const studentGender = student.gender === 'Female' ? 'Girls' : 'Boys';
 
                      // Tab filter
                      if (studentGender !== activeTab) return false;
 
                      const name = student.userId?.name || '';
                      const nameMatch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        student.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase());
                      const branchMatch = filterBranch === 'All' || student.branch === filterBranch;
                      const yearMatch = filterYear === 'All' || student.academicYear === filterYear;
                      const statusMatch = filterStatus === 'All' || student.status === filterStatus;
                      const cgpaMatch = student.cgpa >= minCgpa;
                      return nameMatch && branchMatch && yearMatch && statusMatch && cgpaMatch;
                    })
                    .map((student, index) => (
                      <tr key={student._id} className="hover:bg-slate-50 transition duration-150">
                        <td className="px-6 py-4 font-bold text-slate-400">#{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{student.userId?.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{student.userId?.email}</div>
                        </td>
                        <td className="px-6 py-4 font-black text-brand-teal">{student.priorityScore}</td>
                        <td className="px-6 py-4 text-slate-600 font-semibold">{student.cgpa}</td>
                        <td className="px-6 py-4 text-slate-600">{student.branch}</td>
                        <td className="px-6 py-4 text-slate-600">{student.academicYear}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={changedPlacements[student._id] !== undefined ? changedPlacements[student._id] : (student.allocatedHostelId?._id || student.allocatedHostelId || '')}
                              onChange={(e) => handlePlacementDropdownChange(student._id, e.target.value)}
                              disabled={engineLoading}
                              className="premium-input py-1 text-xs bg-white text-slate-800 cursor-pointer max-w-[140px] font-semibold border-slate-200"
                            >
                              <option value="">Unassigned</option>
                              {hostelsList
                                .filter(h => h.genderRestriction === (student.gender === 'Female' ? 'Girls' : 'Boys'))
                                .map(h => (
                                  <option key={h._id} value={h._id}>{h.name}</option>
                                ))
                              }
                            </select>
                            {changedPlacements[student._id] !== undefined && (
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => handleManualAllocateStudent(student._id, changedPlacements[student._id])}
                                  className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                                  title="Save placement override"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => handleCancelPlacementChange(student._id)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-550 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-slate-200"
                                  title="Cancel changes"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase border ${
                            student.status === 'Allocated'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : student.status === 'Waitlisted'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-white/5 text-slate-400 border-white/5'
                          }`}>
                            {student.status}
                            {student.status === 'Waitlisted' && ` #${student.waitlistPosition}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {students.filter(s => {
                    const studentGender = s.gender === 'Female' ? 'Girls' : 'Boys';
                    return studentGender === activeTab;
                  }).length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-6 py-10 text-center text-slate-500 font-medium">
                        No students registered in this section yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel border border-white/10 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 text-rose-450">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black uppercase tracking-wider">Unallocate All Students</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Are you sure you want to unallocate ALL students and reset all room assignments in the database? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="btn-secondary py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={submitUnallocateAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-rose-600/25"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostelAllocation;
