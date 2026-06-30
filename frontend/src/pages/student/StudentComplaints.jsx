import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../utils/api';
import { Flag, FlameKindling, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const StudentComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    accusedEmail: '',
    type: 'Noise',
    severity: 'Low',
    description: '',
  });

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      if (res.data.success) {
        setComplaints(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to synchronize complaints.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post('/complaints', form);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Dispute report submitted successfully to the hostel warden.' });
        setForm({ accusedEmail: '', type: 'Noise', severity: 'Low', description: '' });
        await fetchComplaints();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to file dispute.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-brand-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Conflict Desk" />
          <main className="flex-grow p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Loading complaints desk...</p>
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
        <Header title="Conflict Desk" />

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Report Form */}
            <div className="premium-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Flag className="w-5 h-5 text-brand-teal" />
                  <h4 className="text-sm font-bold text-slate-800">Report Roommate Issue</h4>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Accused Student Email</label>
                    <input
                      type="email"
                      value={form.accusedEmail}
                      onChange={(e) => setForm({ ...form, accusedEmail: e.target.value })}
                      placeholder="e.g. rohan@gmail.com"
                      className="premium-input text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Issue Category</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="premium-input text-xs bg-white text-slate-800 cursor-pointer"
                    >
                      <option value="Noise">Noise Disturbances</option>
                      <option value="Cleanliness">Cleanliness Issues</option>
                      <option value="Disturbance">General Disturbance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Severity Assessment</label>
                    <select
                      value={form.severity}
                      onChange={(e) => setForm({ ...form, severity: e.target.value })}
                      className="premium-input text-xs bg-white text-slate-800 cursor-pointer"
                    >
                      <option value="Low">Low (minor inconvenience)</option>
                      <option value="Medium">Medium (repeated annoyance)</option>
                      <option value="High">High (unbearable / safety concern)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe the issue in detail..."
                      className="premium-input text-xs h-28 resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-3 flex items-center justify-center text-xs tracking-wider uppercase font-black mt-2"
                  >
                    {submitting ? 'Submitting report...' : 'Log Dispute Report'}
                  </button>
                </form>
              </div>
            </div>

            {/* Complaints Log History */}
            <div className="premium-card p-6 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <FlameKindling className="w-5 h-5 text-brand-teal" />
                <h4 className="text-sm font-bold text-slate-800">Conflict Logs</h4>
              </div>

              <div className="space-y-4">
                {complaints.map(item => (
                  <div key={item._id} className="p-5 border border-slate-200 rounded-xl bg-slate-50/20 hover:border-slate-300 transition duration-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {item.type} Dispute
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                          Accused: {item.accusedId?.name} ({item.accusedId?.email})
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${
                          item.severity === 'High'
                            ? 'bg-rose-55 text-rose-700 border-rose-200'
                            : item.severity === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {item.severity} Risk
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${
                          item.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-3 italic leading-relaxed pl-3 border-l border-slate-350">
                      "{item.description}"
                    </p>
                  </div>
                ))}

                {complaints.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-10 border border-dashed border-slate-200 rounded-xl bg-white font-medium">
                    No complaints registered.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentComplaints;
