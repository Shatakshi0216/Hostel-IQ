import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../utils/api';
import { HelpCircle, Save, CheckCircle, AlertTriangle } from 'lucide-react';

const StudentQuiz = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [status, setStatus] = useState(null); // To lock forms if already allocated

  const [form, setForm] = useState({
    cgpa: 7.0,
    batch: '2024',
    branch: 'CSE',
    region: 'North',
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
            region: prof.region || 'North',
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
        setMessage({ type: 'success', text: 'Lifestyle compatibility profile saved successfully.' });
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
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Lifestyle Quiz" />

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

          <div className="premium-card p-6 max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="w-5 h-5 text-brand-teal" />
              <h4 className="text-sm font-semibold text-brand-dark">Compatibility Questionnaire</h4>
            </div>

            {status === 'Allocated' && (
              <div className="mb-6 p-4 bg-amber-50 border border-brand-warning/10 rounded-lg text-brand-warning text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p><strong>Note:</strong> Hostel/Room matching has already been finalized by administrators. Modifying your profile will not impact your current room details until the next allocation cycle.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Academic/Institutional Fields */}
              <h5 className="text-xs font-bold text-brand-dark uppercase tracking-wider border-b border-slate-100 pb-2">Academic & College Profile</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">CGPA (0.0 - 10.0)</label>
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
                  <label className="block text-xs text-slate-500 mb-1">Batch Year</label>
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
                  <label className="block text-xs text-slate-500 mb-1">Branch / Major</label>
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
                  <label className="block text-xs text-slate-500 mb-1">State / Region</label>
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="premium-input text-xs"
                  >
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Academic Year</label>
                  <select
                    value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: Number(e.target.value) })}
                    className="premium-input text-xs"
                  >
                    <option value="1">1st Year (3-sharing rooms)</option>
                    <option value="2">2nd Year (2-sharing rooms)</option>
                    <option value="3">3rd Year (2-sharing rooms)</option>
                    <option value="4">4th Year (Single rooms)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Floor Preference</label>
                  <select
                    value={form.floorPreference}
                    onChange={(e) => setForm({ ...form, floorPreference: e.target.value })}
                    className="premium-input text-xs"
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="First Floor">First Floor</option>
                    <option value="Second Floor">Second Floor</option>
                    <option value="No Preference">No Preference</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Reservation Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="premium-input text-xs"
                  >
                    <option value="General">General</option>
                    <option value="SC_ST">SC / ST</option>
                    <option value="OBC">OBC</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>

                <div className="sm:col-span-2 grid grid-cols-3 gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.hasDisability}
                      onChange={(e) => setForm({ ...form, hasDisability: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-slate-300"
                    />
                    Physically Disabled
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.hasScholarship}
                      onChange={(e) => setForm({ ...form, hasScholarship: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-slate-300"
                    />
                    Scholarship holder
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.sportsQuota}
                      onChange={(e) => setForm({ ...form, sportsQuota: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-slate-300"
                    />
                    Sports Quota
                  </label>
                </div>
              </div>

              {/* Lifestyle Preferences */}
              <h5 className="text-xs font-bold text-brand-dark uppercase tracking-wider border-b border-slate-100 pb-2 mt-6">Lifestyle & Roommate Compatibility Quiz</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Sleep Schedule</label>
                  <select
                    value={form.sleepSchedule}
                    onChange={(e) => setForm({ ...form, sleepSchedule: e.target.value })}
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
                    value={form.wakeTime}
                    onChange={(e) => setForm({ ...form, wakeTime: e.target.value })}
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
                    value={form.cleanlinessRating}
                    onChange={(e) => setForm({ ...form, cleanlinessRating: Number(e.target.value) })}
                    className="premium-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Study Habits</label>
                  <select
                    value={form.studyHabit}
                    onChange={(e) => setForm({ ...form, studyHabit: e.target.value })}
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
                    value={form.introvertExtrovertScale}
                    onChange={(e) => setForm({ ...form, introvertExtrovertScale: Number(e.target.value) })}
                    className="premium-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Gaming Habit</label>
                  <select
                    value={form.gamingHabit}
                    onChange={(e) => setForm({ ...form, gamingHabit: e.target.value })}
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
                    value={form.musicPreference}
                    onChange={(e) => setForm({ ...form, musicPreference: e.target.value })}
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
                    value={form.sportsInterests}
                    onChange={(e) => setForm({ ...form, sportsInterests: e.target.value })}
                    placeholder="e.g. Cricket, Chess"
                    className="premium-input text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Languages Spoken (Comma separated)</label>
                  <input
                    type="text"
                    value={form.languagesSpoken}
                    onChange={(e) => setForm({ ...form, languagesSpoken: e.target.value })}
                    placeholder="e.g. English, Hindi"
                    className="premium-input text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Personality Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={form.personalityTags}
                    onChange={(e) => setForm({ ...form, personalityTags: e.target.value })}
                    placeholder="e.g. Quiet, Focused"
                    className="premium-input text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2.5 px-6 text-xs flex items-center gap-2"
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
