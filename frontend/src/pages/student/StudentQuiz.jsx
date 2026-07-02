import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../utils/api';
import { HelpCircle, Save, CheckCircle, AlertTriangle } from 'lucide-react';

const StudentQuiz = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [status, setStatus] = useState(null); // To lock forms if already allocated

  const [form, setForm] = useState({
    cgpa: 7.0,
    batch: '2024',
    branch: 'CSE',
    region: 'Delhi',
    gender: 'Male',
    floorPreference: 'No Preference',
    academicYear: 1,
    category: 'General',
    hasDisability: false,
    hasScholarship: false,
    sportsQuota: false,
    sleepSchedule: 'flexible',
    wakeTime: 'moderate',
    cleanlinessRating: 3,
    studyHabit: 'flexible',
    introvertExtrovertScale: 3,
    gamingHabit: 'none',
    musicPreference: 'headphones',
    sportsInterests: '',
    languagesSpoken: '',
    personalityTags: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/matching/details');
        if (res.data.success && res.data.data.profile) {
          const prof = res.data.data.profile;
          setStatus(prof.status);
          const comp = prof.roommateCompatibilityProfile || {};
          setForm({
            cgpa: prof.cgpa || 7.0,
            batch: prof.batch || '2024',
            branch: prof.branch || 'CSE',
            region: prof.region || 'Delhi',
            gender: prof.gender || 'Male',
            floorPreference: prof.floorPreference || 'No Preference',
            academicYear: prof.academicYear || 1,
            category: prof.category || 'General',
            hasDisability: prof.hasDisability || false,
            hasScholarship: prof.hasScholarship || false,
            sportsQuota: prof.sportsQuota || false,
            sleepSchedule: comp.sleepSchedule || 'flexible',
            wakeTime: comp.wakeTime || 'moderate',
            cleanlinessRating: comp.cleanlinessRating || 3,
            studyHabit: comp.studyHabit || 'flexible',
            introvertExtrovertScale: comp.introvertExtrovertScale || 3,
            gamingHabit: comp.gamingHabit || 'none',
            musicPreference: comp.musicPreference || 'headphones',
            sportsInterests: comp.sportsInterests?.join(', ') || '',
            languagesSpoken: comp.languagesSpoken?.join(', ') || '',
            personalityTags: comp.personalityTags?.join(', ') || '',
          });
        }
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Failed to retrieve profile quiz.' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const formattedData = {
      ...form,
      sportsInterests: form.sportsInterests.split(',').map(s => s.trim()).filter(Boolean),
      languagesSpoken: form.languagesSpoken.split(',').map(s => s.trim()).filter(Boolean),
      personalityTags: form.personalityTags.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      const res = await api.put('/matching/profile', formattedData);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Lifestyle compatibility profile saved successfully. Redirecting...' });
        setTimeout(() => {
          navigate('/student/dashboard');
        }, 2000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update compatibility profile.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-brand-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Lifestyle Quiz" />
          <main className="flex-grow p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Loading quiz...</p>
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
        <Header title="Lifestyle Quiz" />

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
            <div className="flex items-center gap-2.5 mb-6">
              <HelpCircle className="w-5 h-5 text-brand-teal" />
              <h4 className="text-sm font-bold text-slate-800">Compatibility Questionnaire</h4>
            </div>

            {status === 'Allocated' && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs flex gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p><strong>Note:</strong> Hostel/Room matching has already been finalized by administrators. Modifying your profile will not impact your current room details until the next allocation cycle.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Academic/Institutional Fields */}
              <h5 className="text-[10px] font-bold text-brand-teal uppercase tracking-widest border-b border-slate-200 pb-2">Academic & College Profile</h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-550 mb-1.5">CGPA (0.0 - 10.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={form.cgpa}
                    onChange={(e) => setForm({ ...form, cgpa: Number(e.target.value) })}
                    className="premium-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-555 mb-1.5">Batch Year</label>
                  <input
                    type="text"
                    value={form.batch}
                    onChange={(e) => setForm({ ...form, batch: e.target.value })}
                    placeholder="e.g. 2024"
                    className="premium-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-555 mb-1.5">Branch / Major</label>
                  <input
                    type="text"
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    placeholder="e.g. CSE"
                    className="premium-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-555 mb-1.5">State / Region</label>
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="premium-input text-xs bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="Delhi">Delhi</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Assam">Assam</option>
                    <option value="Goa">Goa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-555 mb-1.5">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="premium-input text-xs bg-white text-slate-800 cursor-pointer"
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-555 mb-1.5">Academic Year / Cohort</label>
                  <select
                    value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    className="premium-input text-xs bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="BTech 1">BTech 1st Year (3-sharing rooms)</option>
                    <option value="BTech 2">BTech 2nd Year (2-sharing rooms)</option>
                    <option value="BTech 3">BTech 3rd Year (2-sharing rooms)</option>
                    <option value="BTech 4">BTech 4th Year (Single rooms)</option>
                    <option value="MTech">MTech</option>
                    <option value="MCA">MCA</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-555 mb-1.5">Floor Preference</label>
                  <select
                    value={form.floorPreference}
                    onChange={(e) => setForm({ ...form, floorPreference: e.target.value })}
                    className="premium-input text-xs bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="First Floor">First Floor</option>
                    <option value="Second Floor">Second Floor</option>
                    <option value="No Preference">No Preference</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-555 mb-1.5">Reservation Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="premium-input text-xs bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="General">General</option>
                    <option value="SC_ST">SC / ST</option>
                    <option value="OBC">OBC</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>

                <div className="sm:col-span-2 grid grid-cols-3 gap-4 pt-3 border-t border-slate-200 mt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900 transition">
                    <input 
                      type="checkbox" 
                      checked={form.hasDisability}
                      onChange={(e) => setForm({ ...form, hasDisability: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-brand-teal focus:ring-brand-teal cursor-pointer accent-brand-teal"
                    />
                    Physically Disabled
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900 transition">
                    <input 
                      type="checkbox" 
                      checked={form.hasScholarship}
                      onChange={(e) => setForm({ ...form, hasScholarship: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-brand-teal focus:ring-brand-teal cursor-pointer accent-brand-teal"
                    />
                    Scholarship Holder
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900 transition">
                    <input 
                      type="checkbox" 
                      checked={form.sportsQuota}
                      onChange={(e) => setForm({ ...form, sportsQuota: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-brand-teal focus:ring-brand-teal cursor-pointer accent-brand-teal"
                    />
                    Sports Quota
                  </label>
                </div>
              </div>

              {/* Lifestyle Preferences */}
              <h5 className="text-[10px] font-bold text-brand-teal uppercase tracking-widest border-b border-slate-200 pb-2 mt-8">Lifestyle & Roommate Compatibility Quiz</h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Sleep Schedule</label>
                  <select
                    value={form.sleepSchedule}
                    onChange={(e) => setForm({ ...form, sleepSchedule: e.target.value })}
                    className="premium-input text-xs bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="early_bird">Early Bird</option>
                    <option value="night_owl">Night Owl</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Wake Time</label>
                  <select
                    value={form.wakeTime}
                    onChange={(e) => setForm({ ...form, wakeTime: e.target.value })}
                    className="premium-input text-xs bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="early">Early (Before 7:00 AM)</option>
                    <option value="moderate">Moderate (7:00 AM - 9:00 AM)</option>
                    <option value="late">Late (After 9:00 AM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Cleanliness Rating (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={form.cleanlinessRating}
                    onChange={(e) => setForm({ ...form, cleanlinessRating: Number(e.target.value) })}
                    className="premium-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Study Habits</label>
                  <select
                    value={form.studyHabit}
                    onChange={(e) => setForm({ ...form, studyHabit: e.target.value })}
                    className="premium-input text-xs bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="quiet">Strictly Quiet</option>
                    <option value="group">Study Groups</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Introvert vs Extrovert Scale (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={form.introvertExtrovertScale}
                    onChange={(e) => setForm({ ...form, introvertExtrovertScale: Number(e.target.value) })}
                    className="premium-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Gaming Habit</label>
                  <select
                    value={form.gamingHabit}
                    onChange={(e) => setForm({ ...form, gamingHabit: e.target.value })}
                    className="premium-input text-xs bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="none">No Gaming</option>
                    <option value="casual">Casual / Sometimes</option>
                    <option value="heavy">Heavy Gamer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Music Habit</label>
                  <select
                    value={form.musicPreference}
                    onChange={(e) => setForm({ ...form, musicPreference: e.target.value })}
                    className="premium-input text-xs bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="headphones">Always on Headphones</option>
                    <option value="speakers">Okay with Speakers</option>
                    <option value="none">Prefer complete silence</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Sports Interests (Comma separated)</label>
                  <input
                    type="text"
                    value={form.sportsInterests}
                    onChange={(e) => setForm({ ...form, sportsInterests: e.target.value })}
                    placeholder="e.g. Cricket, Chess"
                    className="premium-input text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Languages Spoken (Comma separated)</label>
                  <input
                    type="text"
                    value={form.languagesSpoken}
                    onChange={(e) => setForm({ ...form, languagesSpoken: e.target.value })}
                    placeholder="e.g. English, Hindi"
                    className="premium-input text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Personality Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={form.personalityTags}
                    onChange={(e) => setForm({ ...form, personalityTags: e.target.value })}
                    placeholder="e.g. Quiet, Focused"
                    className="premium-input text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-5 border-t border-slate-200 mt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-3 px-6 text-xs flex items-center gap-2 uppercase tracking-wider font-black"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Saving modifications...' : 'Save Compatibility Profile'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentQuiz;
