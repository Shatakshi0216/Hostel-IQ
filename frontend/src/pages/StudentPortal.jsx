import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  User, 
  Users, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Trash2,
  Lock,
  Flag,
  FlameKindling,
  Search,
  RefreshCw
} from 'lucide-react';

const StudentPortal = () => {
  const { refreshMe } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview, quiz, preferences, complaints, swap
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Data states
  const [details, setDetails] = useState(null);
  const [studentsList, setStudentsList] = useState([]); // List for preference autocomplete
  const [complaints, setComplaints] = useState([]);

  // Room swap states
  const [swapRequests, setSwapRequests] = useState([]);
  const [swapEmail, setSwapEmail] = useState('');
  const [swapMessage, setSwapMessage] = useState({ type: '', text: '' });

  // Form states
  const [quizForm, setQuizForm] = useState({
    cgpa: 7.0,
    distanceFromHome: 100,
    academicYear: 'BTech 1',
    category: 'General',
    hasDisability: false,
    hasScholarship: false,
    sportsQuota: false,
    sleepSchedule: 'flexible',
    wakeTime: 'moderate',
    cleanlinessRating: 3,
    studyHabit: 'flexible',
    introvertExtrovertScale: 3,
    smokingPreference: 'non_smoker',
    gamingHabit: 'none',
    musicPreference: 'headphones',
    sportsInterests: '',
    languagesSpoken: '',
    personalityTags: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPreferences, setSelectedPreferences] = useState([]);

  const [complaintForm, setComplaintForm] = useState({
    accusedEmail: '',
    type: 'Noise',
    severity: 'Low',
    description: '',
  });

  const fetchSwapRequests = async () => {
    try {
      const res = await api.get('/rooms/swaps');
      if (res.data.success) {
        setSwapRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to retrieve swap requests:', err);
    }
  };

  const handleSendSwapRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSwapMessage({ type: '', text: '' });

    try {
      const res = await api.post('/rooms/swaps/request', { targetEmail: swapEmail });
      if (res.data.success) {
        setSwapMessage({ type: 'success', text: 'Room swap request sent successfully!' });
        setSwapEmail('');
        fetchSwapRequests();
      }
    } catch (err) {
      setSwapMessage({ type: 'error', text: err.response?.data?.message || 'Failed to send swap request' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondSwap = async (requestId, action) => {
    try {
      const res = await api.put(`/rooms/swaps/request/${requestId}`, { action });
      if (res.data.success) {
        setSwapMessage({ type: 'success', text: res.data.message || `Swap request ${action}ed!` });
        fetchSwapRequests();
        fetchStudentData(); // Refresh current room allocations
      }
    } catch (err) {
      setSwapMessage({ type: 'error', text: err.response?.data?.message || 'Failed to respond to swap request' });
    }
  };

  const fetchStudentData = async () => {
    try {
      const detailsRes = await api.get('/matching/details');
      if (detailsRes.data.success) {
        const data = detailsRes.data.data;
        setDetails(data);
        
        // Sync quiz form fields
        if (data.profile) {
          const prof = data.profile;
          const comp = prof.roommateCompatibilityProfile || {};
          setQuizForm({
            cgpa: prof.cgpa || 7.0,
            distanceFromHome: prof.distanceFromHome || 100,
            academicYear: prof.academicYear || 'BTech 1',
            category: prof.category || 'General',
            hasDisability: prof.hasDisability || false,
            hasScholarship: prof.hasScholarship || false,
            sportsQuota: prof.sportsQuota || false,
            sleepSchedule: comp.sleepSchedule || 'flexible',
            wakeTime: comp.wakeTime || 'moderate',
            cleanlinessRating: comp.cleanlinessRating || 3,
            studyHabit: comp.studyHabit || 'flexible',
            introvertExtrovertScale: comp.introvertExtrovertScale || 3,
            smokingPreference: comp.smokingPreference || 'non_smoker',
            gamingHabit: comp.gamingHabit || 'none',
            musicPreference: comp.musicPreference || 'headphones',
            sportsInterests: comp.sportsInterests?.join(', ') || '',
            languagesSpoken: comp.languagesSpoken?.join(', ') || '',
            personalityTags: comp.personalityTags?.join(', ') || '',
          });
          
          setSelectedPreferences(prof.preferredRoommates || []);

          if (prof.allocatedRoomId) {
            fetchSwapRequests();
          }
        }
      }

      // Fetch roommate list options
      const optRes = await api.get('/matching/options');
      if (optRes.data.success) {
        setStudentsList(optRes.data.data);
      }

      // Fetch complaints
      const compRes = await api.get('/complaints');
      if (compRes.data.success) {
        setComplaints(compRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to synchronize portal data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  // Handle Quiz Form Updates
  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const formattedData = {
      ...quizForm,
      sportsInterests: quizForm.sportsInterests.split(',').map(s => s.trim()).filter(Boolean),
      languagesSpoken: quizForm.languagesSpoken.split(',').map(s => s.trim()).filter(Boolean),
      personalityTags: quizForm.personalityTags.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      const res = await api.put('/matching/profile', formattedData);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Compatibility profile saved' });
        await fetchStudentData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update compatibility profile' });
    } finally {
      setSubmitting(false);
    }
  };

  // Autocomplete Roommate Preference Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = studentsList.filter(student => 
      (student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      student.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !selectedPreferences.some(pref => pref._id === student._id)
    );
    setSearchResults(filtered.slice(0, 5));
  }, [searchQuery, studentsList, selectedPreferences]);

  const handleAddPreference = async (student) => {
    if (selectedPreferences.length >= 5) {
      setMessage({ type: 'error', text: 'You can choose at most 5 preferred roommates' });
      return;
    }
    const newPrefs = [...selectedPreferences, student];
    setSelectedPreferences(newPrefs);
    setSearchQuery('');

    // Save preferences immediately to backend
    try {
      const pIds = newPrefs.map(p => p._id);
      await api.put('/matching/preferences', { preferredRoommates: pIds });
      setMessage({ type: 'success', text: 'Preferred roommates updated' });
      await fetchStudentData();
      await refreshMe();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save roommate choice' });
    }
  };

  const handleRemovePreference = async (id) => {
    const newPrefs = selectedPreferences.filter(p => p._id !== id);
    setSelectedPreferences(newPrefs);

    try {
      const pIds = newPrefs.map(p => p._id);
      await api.put('/matching/preferences', { preferredRoommates: pIds });
      setMessage({ type: 'success', text: 'Preferred roommate removed' });
      await fetchStudentData();
      await refreshMe();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update preferred roommates' });
    }
  };

  // Complaint Submit
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post('/complaints', complaintForm);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Complaint reported to warden' });
        setComplaintForm({ accusedEmail: '', type: 'Noise', severity: 'Low', description: '' });
        // Refresh complaints list
        const compRes = await api.get('/complaints');
        if (compRes.data.success) {
          setComplaints(compRes.data.data);
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to file complaint' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-brand-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Student Workspace" />
          <main className="flex-grow p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Retrieving student records...</p>
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
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Student Workspace" />

        {/* Tab navigation */}
        <div className="bg-white border-b border-slate-200 px-8 flex gap-6">
          {['overview', 'quiz', 'preferences', 'complaints', 'swap'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setMessage({ type: '', text: '' }); }}
              className={`py-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === tab
                  ? 'border-brand-teal text-brand-dark'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'quiz' && 'Compatibility Quiz'}
              {tab === 'preferences' && 'Roommate Preferences'}
              {tab === 'complaints' && 'Conflict Desk'}
              {tab === 'swap' && 'Room Swap'}
            </button>
          ))}
        </div>

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

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Allocation status cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="premium-card p-6 md:col-span-2 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal shrink-0">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hostel Assignment</span>
                    <h3 className="text-xl font-bold text-brand-dark mt-1">
                      {profile.allocatedHostelId?.name || 'Unassigned'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {profile.status === 'Allocated' && profile.allocatedRoomId 
                        ? `Block: ${profile.allocatedRoomId.block} — Room: ${profile.allocatedRoomId.roomNumber}`
                        : profile.status === 'Waitlisted'
                        ? 'Hostel allocation is pending in waitlist queue'
                        : 'Rules allocation process has not been executed by admin'}
                    </p>
                  </div>
                </div>

                <div className="premium-card p-6">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Allocation Status</span>
                  <div className="mt-3">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                      profile.status === 'Allocated'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : profile.status === 'Waitlisted'
                        ? 'bg-amber-50 text-brand-warning border border-brand-warning/10'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {profile.status}
                      {profile.status === 'Waitlisted' && ` (Position: #${profile.waitlistPosition})`}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 mt-4 block flex items-center gap-1">
                    <FlameKindling className="w-3.5 h-3.5 text-rose-500" />
                    Conflict Risk: <strong>{risk.category}</strong>
                  </span>
                </div>
              </div>

              {/* Roommate details */}
              {profile.status === 'Allocated' && (
                <div className="premium-card overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h4 className="text-sm font-semibold text-brand-dark">Room Occupants</h4>
                    <p className="text-xs text-slate-400">Students sharing Room {profile.allocatedRoomId?.roomNumber}</p>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {roommates.map(rm => (
                      <div key={rm._id} className="p-4 border border-slate-100 rounded-lg bg-slate-50/50 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-brand-dark block">{rm.name}</span>
                            <span className="text-[10px] text-slate-400">{rm.email}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rm.preferenceStatus === 'Mutual Match'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            {rm.preferenceStatus}
                          </span>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-400">Matching compatibility:</span>
                          <span className="text-sm font-bold text-brand-teal">{rm.compatibilityScore}%</span>
                        </div>
                      </div>
                    ))}
                    {roommates.length === 0 && (
                      <p className="text-xs text-slate-500 col-span-2 text-center py-4">
                        You currently have no roommates matched in this room.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COMPATIBILITY QUIZ */}
          {activeTab === 'quiz' && (
            <div className="premium-card p-6 max-w-3xl">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-brand-teal" />
                <h4 className="text-sm font-semibold text-brand-dark">Compatibility Questionnaire</h4>
              </div>

              {profile.status === 'Allocated' && (
                <div className="mb-6 p-4 bg-amber-50 border border-brand-warning/10 rounded-lg text-brand-warning text-xs flex gap-2">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <p><strong>Note:</strong> Hostel/Room matching has already been finalized by administrators. Modifying your profile will not impact your current room details until the next allocation cycle.</p>
                </div>
              )}

              <form onSubmit={handleQuizSubmit} className="space-y-6">
                {/* Academic Fields */}
                <h5 className="text-xs font-bold text-brand-dark uppercase tracking-wider border-b border-slate-100 pb-2">Academic & Category Metadata</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">CGPA (0 - 10)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={quizForm.cgpa}
                      onChange={(e) => setQuizForm({ ...quizForm, cgpa: Number(e.target.value) })}
                      className="premium-input text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Distance from Home (km)</label>
                    <input
                      type="number"
                      min="0"
                      value={quizForm.distanceFromHome}
                      onChange={(e) => setQuizForm({ ...quizForm, distanceFromHome: Number(e.target.value) })}
                      className="premium-input text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Academic Year</label>
                    <select
                      value={quizForm.academicYear}
                      onChange={(e) => setQuizForm({ ...quizForm, academicYear: Number(e.target.value) })}
                      className="premium-input text-xs"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Reservation Category</label>
                    <select
                      value={quizForm.category}
                      onChange={(e) => setQuizForm({ ...quizForm, category: e.target.value })}
                      className="premium-input text-xs"
                    >
                      <option value="General">General</option>
                      <option value="SC_ST">SC / ST</option>
                      <option value="OBC">OBC</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={quizForm.hasDisability}
                        onChange={(e) => setQuizForm({ ...quizForm, hasDisability: e.target.checked })}
                        className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-slate-300"
                      />
                      Physically Disabled
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={quizForm.hasScholarship}
                        onChange={(e) => setQuizForm({ ...quizForm, hasScholarship: e.target.checked })}
                        className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-slate-300"
                      />
                      Scholarship Student
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={quizForm.sportsQuota}
                        onChange={(e) => setQuizForm({ ...quizForm, sportsQuota: e.target.checked })}
                        className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-slate-300"
                      />
                      Sports Quota
                    </label>
                  </div>
                </div>

                {/* Compatibility Fields */}
                <h5 className="text-xs font-bold text-brand-dark uppercase tracking-wider border-b border-slate-100 pb-2 mt-6">Lifestyle Preferences</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Sleep Schedule</label>
                    <select
                      value={quizForm.sleepSchedule}
                      onChange={(e) => setQuizForm({ ...quizForm, sleepSchedule: e.target.value })}
                      className="premium-input text-xs"
                    >
                      <option value="early_bird">Early Bird</option>
                      <option value="night_owl">Night Owl</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Wake Time</label>
                    <select
                      value={quizForm.wakeTime}
                      onChange={(e) => setQuizForm({ ...quizForm, wakeTime: e.target.value })}
                      className="premium-input text-xs"
                    >
                      <option value="early">Early (Before 7:00 AM)</option>
                      <option value="moderate">Moderate (7:00 AM - 9:00 AM)</option>
                      <option value="late">Late (After 9:00 AM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Cleanliness Rating (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={quizForm.cleanlinessRating}
                      onChange={(e) => setQuizForm({ ...quizForm, cleanlinessRating: Number(e.target.value) })}
                      className="premium-input text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Study Habits</label>
                    <select
                      value={quizForm.studyHabit}
                      onChange={(e) => setQuizForm({ ...quizForm, studyHabit: e.target.value })}
                      className="premium-input text-xs"
                    >
                      <option value="quiet">Strictly Quiet</option>
                      <option value="group">Study Groups</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Introvert vs Extrovert Scale (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={quizForm.introvertExtrovertScale}
                      onChange={(e) => setQuizForm({ ...quizForm, introvertExtrovertScale: Number(e.target.value) })}
                      className="premium-input text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Smoking Habit</label>
                    <select
                      value={quizForm.smokingPreference}
                      onChange={(e) => setQuizForm({ ...quizForm, smokingPreference: e.target.value })}
                      className="premium-input text-xs"
                    >
                      <option value="non_smoker">Non-smoker</option>
                      <option value="smoker">Active Smoker</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Gaming Habit</label>
                    <select
                      value={quizForm.gamingHabit}
                      onChange={(e) => setQuizForm({ ...quizForm, gamingHabit: e.target.value })}
                      className="premium-input text-xs"
                    >
                      <option value="none">No Gaming</option>
                      <option value="casual">Casual / Sometimes</option>
                      <option value="heavy">Heavy Gamer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Music Habit</label>
                    <select
                      value={quizForm.musicPreference}
                      onChange={(e) => setQuizForm({ ...quizForm, musicPreference: e.target.value })}
                      className="premium-input text-xs"
                    >
                      <option value="headphones">Always on Headphones</option>
                      <option value="speakers">Okay with Speakers</option>
                      <option value="none">Prefer complete silence</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Sports Interests (Comma separated)</label>
                    <input
                      type="text"
                      value={quizForm.sportsInterests}
                      onChange={(e) => setQuizForm({ ...quizForm, sportsInterests: e.target.value })}
                      placeholder="e.g. Football, Chess, Cricket"
                      className="premium-input text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Languages Spoken (Comma separated)</label>
                    <input
                      type="text"
                      value={quizForm.languagesSpoken}
                      onChange={(e) => setQuizForm({ ...quizForm, languagesSpoken: e.target.value })}
                      placeholder="e.g. English, Hindi, Spanish"
                      className="premium-input text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Personality Tags (Comma separated)</label>
                    <input
                      type="text"
                      value={quizForm.personalityTags}
                      onChange={(e) => setQuizForm({ ...quizForm, personalityTags: e.target.value })}
                      placeholder="e.g. Quiet, Gamer, Studious, Outgoing"
                      className="premium-input text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary py-2 px-6 text-xs"
                  >
                    {submitting ? 'Saving changes...' : 'Save Compatibility Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: ROOMMATE PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="premium-card p-6 max-w-3xl">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-brand-teal" />
                <h4 className="text-sm font-semibold text-brand-dark">Preferred Roommate Selections</h4>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                You can select up to 5 preferred roommates. If they choose you back, it generates a Mutual Match and guarantees highest priority matching in the graph matchmaking engine.
              </p>

              {/* Roommate Search Autocomplete */}
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student by name or email..."
                  className="premium-input pl-10 text-xs"
                  disabled={selectedPreferences.length >= 5}
                />
                
                {/* Autocomplete dropdown */}
                {searchResults.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-slate-200 mt-1.5 rounded-lg shadow-lg divide-y divide-slate-100 overflow-hidden">
                    {searchResults.map(student => (
                      <li 
                        key={student._id}
                        onClick={() => handleAddPreference(student)}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition"
                      >
                        <div>
                          <span className="font-semibold text-brand-dark block">{student.name}</span>
                          <span className="text-[10px] text-slate-400">{student.email}</span>
                        </div>
                        <Plus className="w-4 h-4 text-brand-teal" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Preference list (Sorted 1-5) */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Priority Preference List</h5>
                {selectedPreferences.map((pref, index) => (
                  <div key={pref._id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      <div>
                        <span className="text-xs font-semibold text-brand-dark block">{pref.name}</span>
                        <span className="text-[10px] text-slate-400">{pref.email}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemovePreference(pref._id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {selectedPreferences.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                    No preferred roommates selected. Search and select above.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CONFLICT DESK */}
          {activeTab === 'complaints' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Report form */}
              <div className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Flag className="w-5 h-5 text-brand-teal" />
                  <h4 className="text-sm font-semibold text-brand-dark">Report Roommate Complaint</h4>
                </div>
                
                <form onSubmit={handleComplaintSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Accused Student Email</label>
                    <input
                      type="email"
                      value={complaintForm.accusedEmail}
                      onChange={(e) => setComplaintForm({ ...complaintForm, accusedEmail: e.target.value })}
                      placeholder="e.g. student@gmail.com"
                      className="premium-input text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Complaint Category</label>
                    <select
                      value={complaintForm.type}
                      onChange={(e) => setComplaintForm({ ...complaintForm, type: e.target.value })}
                      className="premium-input text-xs"
                    >
                      <option value="Noise">Noise Disturbances</option>
                      <option value="Cleanliness">Cleanliness Issues</option>
                      <option value="Smoking">Smoking in Rooms</option>
                      <option value="Disturbance">General Disturbance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Severity Assessment</label>
                    <select
                      value={complaintForm.severity}
                      onChange={(e) => setComplaintForm({ ...complaintForm, severity: e.target.value })}
                      className="premium-input text-xs"
                    >
                      <option value="Low">Low (minor inconvenience)</option>
                      <option value="Medium">Medium (repeated annoyance)</option>
                      <option value="High">High (unbearable / safety concern)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Detailed Description</label>
                    <textarea
                      value={complaintForm.description}
                      onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                      placeholder="Describe the issue in detail..."
                      className="premium-input text-xs h-28 resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-2.5 flex items-center justify-center text-xs mt-2"
                  >
                    {submitting ? 'Submitting report...' : 'Log Dispute Report'}
                  </button>
                </form>
              </div>

              {/* Complaints History */}
              <div className="premium-card p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <FlameKindling className="w-5 h-5 text-brand-teal" />
                  <h4 className="text-sm font-semibold text-brand-dark">Conflict Log History</h4>
                </div>

                <div className="space-y-4">
                  {complaints.map(item => {
                    const isReporter = item.reporterId?._id === details?.profile?.userId;
                    return (
                      <div key={item._id} className="p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-brand-dark block">
                              {item.type} Dispute
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {isReporter 
                                ? `Accused: ${item.accusedId?.name} (${item.accusedId?.email})` 
                                : `Reported by: ${item.reporterId?.name}`}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              item.severity === 'High'
                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                : item.severity === 'Medium'
                                ? 'bg-amber-50 text-brand-warning border border-brand-warning/10'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {item.severity} Risk
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              item.status === 'Resolved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-amber-50 text-brand-warning border border-brand-warning/10'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 mt-2 italic leading-relaxed">
                          "{item.description}"
                        </p>
                      </div>
                    );
                  })}

                  {complaints.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                      No complaints logged.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ROOM SWAP DESK */}
          {activeTab === 'swap' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Send swap request form */}
              <div className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-brand-teal" />
                  <h4 className="text-sm font-semibold text-brand-dark">Request Room Swap</h4>
                </div>
                
                {profile.status === 'Allocated' && profile.allocatedRoomId ? (
                  <form onSubmit={handleSendSwapRequest} className="space-y-4">
                    {swapMessage.text && (
                      <div className={`p-3 rounded-lg text-xs font-bold border ${
                        swapMessage.type === 'success' 
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-600' 
                          : 'bg-rose-50 border-rose-200 text-rose-600'
                      }`}>
                        {swapMessage.text}
                      </div>
                    )}
                    
                    <div>
                      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        To initiate a swap, enter the exact institutional email address of the classmate you wish to swap rooms with.
                      </p>
                      <label className="block text-xs text-slate-500 mb-1">Classmate's Email Address</label>
                      <input
                        type="email"
                        value={swapEmail}
                        onChange={(e) => setSwapEmail(e.target.value)}
                        placeholder="e.g. student@university.edu"
                        className="premium-input text-xs"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary w-full py-2.5 flex items-center justify-center text-xs mt-2"
                    >
                      {submitting ? 'Sending Request...' : 'Send Swap Request'}
                    </button>
                  </form>
                ) : (
                  <div className="py-6 text-center text-slate-400 font-semibold text-xs leading-relaxed border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                    ⚠️ You must be allocated a room block first to request a swap.
                  </div>
                )}
              </div>

              {/* Active swap logs */}
              <div className="premium-card p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <RefreshCw className="w-5 h-5 text-brand-teal" />
                  <h4 className="text-sm font-semibold text-brand-dark">Room Swap Request Log</h4>
                </div>

                <div className="space-y-4">
                  {swapRequests.length > 0 ? (
                    swapRequests.map(req => {
                      const isRequester = req.requesterId?._id === details?.profile?.userId;
                      const peerUser = isRequester ? req.targetStudentId : req.requesterId;
                      return (
                        <div key={req._id} className="p-4 border border-slate-100 rounded-lg bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-brand-dark block">
                              {isRequester ? `Sent swap request to ${peerUser?.name}` : `Received swap request from ${peerUser?.name}`}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{peerUser?.email}</span>
                            <span className="text-[10px] font-semibold text-slate-500 mt-2 block">
                              Created: {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              req.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : req.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {req.status}
                            </span>
                            
                            {!isRequester && req.status === 'Pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRespondSwap(req._id, 'approve')}
                                  className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRespondSwap(req._id, 'reject')}
                                  className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                      No active or past swap requests found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentPortal;
