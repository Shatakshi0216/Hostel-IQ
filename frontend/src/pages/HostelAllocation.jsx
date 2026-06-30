import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import api from '../utils/api';
import { Play, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

const HostelAllocation = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [engineLoading, setEngineLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('Boys'); // 'Boys' or 'Girls'

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
    <div className="flex h-screen bg-brand-bg overflow-hidden text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Hostel Allocation Engine" />

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl text-sm border flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Orchestrator Header Banner */}
          <div className="premium-card p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-tealLight flex items-center justify-center text-brand-teal shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Match Orchestrator</h4>
                <p className="text-xs text-slate-500 mt-1.5 max-w-xl leading-relaxed">
                  Automate university-wide hostel placements and room assignments. The system computes priority scores (ranking CGPA, regional contributions, academic year brackets, and special status) and maps roommates using graph compatibility matching.
                </p>
              </div>
            </div>

            <button
              onClick={handleRunAllocation}
              disabled={engineLoading}
              className="btn-primary py-3 px-6 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed shrink-0 font-bold tracking-wider text-xs uppercase"
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

          {/* Student Rankings preview */}
          <div className="premium-card overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Calculated Student Rankings</h4>
                <p className="text-xs text-slate-400 mt-0.5">Ranked by Priority Score based on university allocation rules</p>
              </div>

              {/* Gender Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setActiveTab('Boys')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                    activeTab === 'Boys'
                      ? 'bg-white text-brand-dark shadow-sm'
                      : 'text-slate-550 hover:text-brand-dark'
                  }`}
                >
                  Boys Section (H1)
                </button>
                <button
                  onClick={() => setActiveTab('Girls')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                    activeTab === 'Girls'
                      ? 'bg-white text-brand-dark shadow-sm'
                      : 'text-slate-550 hover:text-brand-dark'
                  }`}
                >
                  Girls Section (B1)
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Search Student</label>
                <input
                  type="text"
                  placeholder="Name or Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="premium-input py-1.5 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Branch</label>
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="premium-input py-1.5 text-xs bg-white text-slate-800 cursor-pointer"
                >
                  <option value="All">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="ME">ME</option>
                  <option value="CE">CE</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Batch</label>
                <select
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                  className="premium-input py-1.5 text-xs bg-white text-slate-800 cursor-pointer"
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
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="premium-input py-1.5 text-xs bg-white text-slate-800 cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Allocated">Allocated</option>
                  <option value="Waitlisted">Waitlisted</option>
                  <option value="Unallocated">Unallocated</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Min CGPA ({minCgpa})</label>
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
                    <th className="px-6 py-4">Batch</th>
                    <th className="px-6 py-4">Year</th>
                    <th className="px-6 py-4">Hostel Placement</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {students
                    .filter(student => {
                      const name = student.userId?.name || '';
                      const isFemale = /priya|neha|sita|rita|female|girl|ananya|pooja|sneha/i.test(name);
                      const studentGender = isFemale ? 'Girls' : 'Boys';

                      // Tab filter
                      if (studentGender !== activeTab) return false;

                      const nameMatch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        student.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase());
                      const branchMatch = filterBranch === 'All' || student.branch === filterBranch;
                      const batchMatch = filterBatch === 'All' || student.batch === filterBatch;
                      const statusMatch = filterStatus === 'All' || student.status === filterStatus;
                      const cgpaMatch = student.cgpa >= minCgpa;
                      return nameMatch && branchMatch && batchMatch && statusMatch && cgpaMatch;
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
                        <td className="px-6 py-4 text-slate-600">{student.batch}</td>
                        <td className="px-6 py-4 text-slate-600">{student.academicYear}</td>
                        <td className="px-6 py-4 text-slate-700 font-semibold">
                          {student.allocatedHostelId?.name || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase border ${
                            student.status === 'Allocated'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : student.status === 'Waitlisted'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {student.status}
                            {student.status === 'Waitlisted' && ` #${student.waitlistPosition}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {students.filter(s => {
                    const name = s.userId?.name || '';
                    const isFemale = /priya|neha|sita|rita|female|girl|ananya|pooja|sneha/i.test(name);
                    const studentGender = isFemale ? 'Girls' : 'Boys';
                    return studentGender === activeTab;
                  }).length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-6 py-10 text-center text-slate-400 font-medium">
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
    </div>
  );
};

export default HostelAllocation;
