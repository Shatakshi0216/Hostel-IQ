import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import api from '../utils/api';
import { Play, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

const HostelAllocation = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [engineLoading, setEngineLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterBatch, setFilterBatch] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [minCgpa, setMinCgpa] = useState(0);

  const fetchData = async () => {
    try {
      const studentsRes = await api.get('/allocation/rankings');
      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load student rankings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunAllocation = async () => {
    setMessage({ type: '', text: '' });
    setEngineLoading(true);

    try {
      // Step 1: Run Hostel Allocation
      const hostelRes = await api.post('/allocation/run');
      
      if (hostelRes.data.success) {
        // Step 2: Run Roommate Matching & Room Allocation
        const roomRes = await api.post('/matching/run');
        
        if (roomRes.data.success) {
          setMessage({
            type: 'success',
            text: `Hostel and Room matching completed! Allocated: ${hostelRes.data.allocatedCount} students, Waitlisted: ${hostelRes.data.waitlistCount} students. Roommates paired: ${roomRes.data.totalMatchedStudents}.`,
          });
          // Refresh list
          const rankRes = await api.get('/allocation/rankings');
          setStudents(rankRes.data.data);
        }
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
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Hostel Allocation Engine" />

        <main className="flex-1 overflow-y-auto p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl text-sm border flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                : 'bg-rose-50 border-rose-100 text-rose-700'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Orchestrator Header Banner */}
          <div className="premium-card p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-brand-dark">Match Orchestrator</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                  Automate university-wide hostel placements and room assignments. The system computes priority scores (ranking CGPA, regional contributions, academic year brackets, and special status) and maps roommates using graph compatibility matching.
                </p>
              </div>
            </div>

            <button
              onClick={handleRunAllocation}
              disabled={engineLoading}
              className="btn-primary py-3 px-6 flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed shrink-0"
            >
              {engineLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Allocations...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current animate-pulse" />
                  Execute Match Engines
                </>
              )}
            </button>
          </div>

          {/* Student Rankings preview */}
          <div className="premium-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-brand-dark">Calculated Student Rankings</h4>
              <p className="text-xs text-slate-400">Ranked by Priority Score based on university allocation rules</p>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search Student</label>
                <input
                  type="text"
                  placeholder="Name or Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="premium-input py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Branch</label>
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="premium-input py-1 text-xs"
                >
                  <option value="All">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="ME">ME</option>
                  <option value="CE">CE</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Batch</label>
                <select
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                  className="premium-input py-1 text-xs"
                >
                  <option value="All">All Batches</option>
                  <option value="2020">2020</option>
                  <option value="2021">2021</option>
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="premium-input py-1 text-xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="Allocated">Allocated</option>
                  <option value="Waitlisted">Waitlisted</option>
                  <option value="Unallocated">Unallocated</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Min CGPA ({minCgpa})</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-teal mt-2"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-6 py-3">Rank</th>
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Score</th>
                    <th className="px-6 py-3">CGPA</th>
                    <th className="px-6 py-3">Branch</th>
                    <th className="px-6 py-3">Batch</th>
                    <th className="px-6 py-3">Year</th>
                    <th className="px-6 py-3">Hostel Placement</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students
                    .filter(student => {
                      const nameMatch = student.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        student.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase());
                      const branchMatch = filterBranch === 'All' || student.branch === filterBranch;
                      const batchMatch = filterBatch === 'All' || student.batch === filterBatch;
                      const statusMatch = filterStatus === 'All' || student.status === filterStatus;
                      const cgpaMatch = student.cgpa >= minCgpa;
                      return nameMatch && branchMatch && batchMatch && statusMatch && cgpaMatch;
                    })
                    .map((student, index) => (
                      <tr key={student._id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-400">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-brand-dark">{student.userId?.name}</div>
                          <div className="text-[10px] text-slate-400">{student.userId?.email}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-brand-teal">{student.priorityScore}</td>
                        <td className="px-6 py-4 text-slate-600">{student.cgpa}</td>
                        <td className="px-6 py-4 text-slate-600">{student.branch}</td>
                        <td className="px-6 py-4 text-slate-600">{student.batch}</td>
                        <td className="px-6 py-4 text-slate-600">{student.academicYear}</td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-700">
                            {student.allocatedHostelId?.name || 'Unassigned'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                            student.status === 'Allocated'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : student.status === 'Waitlisted'
                              ? 'bg-amber-50 text-brand-warning border border-brand-warning/10'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {student.status}
                            {student.status === 'Waitlisted' && ` #${student.waitlistPosition}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-6 py-8 text-center text-slate-400">
                        No students found. Seed the database to test rankings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HostelAllocation;
