import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Users, Search, Plus, Trash2, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const StudentPreferences = () => {
  const { refreshMe } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Data states
  const [studentsList, setStudentsList] = useState([]);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Filter states
  const [ownCgpa, setOwnCgpa] = useState(7.0);
  const [filterBranch, setFilterBranch] = useState('All');
  const [allocatedHostelName, setAllocatedHostelName] = useState(null);

  const fetchPreferences = async () => {
    try {
      const res = await api.get('/matching/details');
      if (res.data.success) {
        setSelectedPreferences(res.data.data.profile.preferredRoommates || []);
        setOwnCgpa(res.data.data.profile.cgpa || 7.0);
        setAllocatedHostelName(res.data.data.profile.allocatedHostelId?.name || null);
      }

      const optRes = await api.get('/matching/options');
      if (optRes.data.success) {
        setStudentsList(optRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to retrieve preferred roommates.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  // Filter and search autocomplete candidates
  useEffect(() => {
    if (!searchQuery.trim() && filterBranch === 'All') {
      setSearchResults([]);
      return;
    }

    const filtered = studentsList.filter(student => {
      const notSelected = !selectedPreferences.some(pref => pref._id === student._id);
      if (!notSelected) return false;

      if (searchQuery.trim()) {
        return student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               student.email.toLowerCase().includes(searchQuery.toLowerCase());
      } else if (filterBranch !== 'All') {
        return student.branch === filterBranch;
      }
      return false;
    });

    setSearchResults(filtered.slice(0, 10));
  }, [searchQuery, filterBranch, studentsList, selectedPreferences]);

  const handleAddPreference = async (student) => {
    if (selectedPreferences.length >= 5) {
      setMessage({ type: 'error', text: 'You can select a maximum of 5 preferred roommates.' });
      return;
    }

    const newPrefs = [...selectedPreferences, student];
    setSelectedPreferences(newPrefs);
    setSearchQuery('');
    setFilterBranch('All');

    try {
      const ids = newPrefs.map(p => p._id);
      const res = await api.put('/matching/preferences', { preferredRoommates: ids });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Preferred roommates updated.' });
        await fetchPreferences();
        await refreshMe();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update roommate choices.' });
    }
  };

  const handleRemovePreference = async (id) => {
    const newPrefs = selectedPreferences.filter(p => p._id !== id);
    setSelectedPreferences(newPrefs);

    try {
      const ids = newPrefs.map(p => p._id);
      const res = await api.put('/matching/preferences', { preferredRoommates: ids });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Preferred roommate removed.' });
        await fetchPreferences();
        await refreshMe();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete preferred roommate.' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-brand-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Roommate Choices" />
          <main className="flex-grow p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Loading roommate choices...</p>
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
        <Header title="Roommate Choices" />

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

          <div className="premium-card p-6 max-w-3xl">
            <div className="flex items-center gap-2.5 mb-4">
              <Users className="w-5 h-5 text-brand-teal" />
              <h4 className="text-sm font-bold text-slate-800">Preferred Roommate Choices</h4>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Add up to 5 preferred roommates. If choices are mutual, the graph matching algorithm assigns highest priority edge weights.
              <br />
              <strong className="text-brand-teal font-semibold">Note:</strong> Preferred roommates should be allocated to the same hostel building (same gender) for pairing to occur.
            </p>

            {/* Allocated Hostel Info Banner */}
            {allocatedHostelName ? (
              <div className="mb-6 p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl flex items-center gap-3">
                <Building2 className="w-5 h-5 shrink-0 text-brand-teal" />
                <div>
                  <span className="text-xs font-bold block text-teal-850">Allocated Hostel Block</span>
                  <span className="text-[11px] font-semibold text-slate-600 block mt-0.5">You are assigned to: <strong className="text-slate-800">{allocatedHostelName}</strong>. You can only choose roommates from this hostel block.</span>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-250 text-amber-800 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 animate-pulse" />
                <div>
                  <span className="text-xs font-bold block text-amber-900">Hostel Placement Pending</span>
                  <span className="text-[11px] text-slate-600 leading-relaxed block mt-0.5">
                    You have not been assigned to a hostel block yet. Roommate selections will open once the SuperAdmin assigns your hostel block.
                  </span>
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="grid grid-cols-1 gap-4 mb-5 bg-slate-100/50 p-4 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Filter Candidates by Branch (Clears Search Text)</label>
                <select
                  value={filterBranch}
                  disabled={!allocatedHostelName}
                  onChange={(e) => {
                    setFilterBranch(e.target.value);
                    if (e.target.value !== 'All') {
                      setSearchQuery('');
                    }
                  }}
                  className="premium-input py-1.5 text-xs bg-white text-slate-800 cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="All">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="MDS">MDS</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Mech">Mech</option>
                  <option value="Civil">Civil</option>
                  <option value="Chemical">Chemical</option>
                  <option value="MME">MME</option>
                </select>
              </div>
            </div>

            {/* roommate autocomplete search */}
            <div className="relative mb-8">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                disabled={!allocatedHostelName || selectedPreferences.length >= 5}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) {
                    setFilterBranch('All');
                  }
                }}
                placeholder={allocatedHostelName ? "Search student by name or email... (Clears Branch Filter)" : "Hostel allocation is required"}
                className="premium-input pl-10 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              
              {/* Search dropdown */}
              {searchResults.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-slate-200 mt-2 rounded-xl shadow-lg divide-y divide-slate-100 overflow-y-auto max-h-60">
                  {searchResults.map(student => {
                    const cgpaDiff = Math.abs(ownCgpa - student.cgpa);
                    const isWarning = cgpaDiff >= 2.0;
                    return (
                      <li 
                        key={student._id}
                        onClick={() => handleAddPreference(student)}
                        className="px-4 py-3.5 hover:bg-slate-50 cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs transition"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">{student.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{student.email}</span>
                          <div className="flex gap-2 mt-1.5">
                            <span className="text-[9px] text-slate-500 font-semibold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              Branch: {student.branch}
                            </span>
                            <span className="text-[9px] text-slate-500 font-semibold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              Region: {student.region}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Plus className="w-4 h-4 text-brand-teal shrink-0" />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Selections list */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Priority Preference List</h5>
              
              {selectedPreferences.map((pref, index) => (
                <div key={pref._id} className="flex flex-col p-4 border border-slate-200 rounded-xl bg-slate-55/30 space-y-3 hover:border-slate-300 transition-all duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{pref.name}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{pref.email}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemovePreference(pref._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Eligibility Alert Banner */}
                  {pref.eligibilityWarning && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-[10px] flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{pref.eligibilityWarning}</span>
                    </div>
                  )}
                </div>
              ))}

              {selectedPreferences.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/20 font-medium">
                  No roommate choices selected. Search and select above to start.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentPreferences;
