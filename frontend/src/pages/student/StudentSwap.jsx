import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../utils/api';
import { Users, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

const StudentSwap = () => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [swapRequests, setSwapRequests] = useState([]);
  const [swapEmail, setSwapEmail] = useState('');
  const [swapMessage, setSwapMessage] = useState({ type: '', text: '' });
  const [error, setError] = useState('');

  const fetchStudentData = async () => {
    try {
      const detailsRes = await api.get('/matching/details');
      if (detailsRes.data.success) {
        const data = detailsRes.data.data;
        setDetails(data);

        if (data.profile && data.profile.allocatedRoomId) {
          await fetchSwapRequests();
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to sync student allocation details');
    } finally {
      setLoading(false);
    }
  };

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
        await fetchSwapRequests();
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
        await fetchSwapRequests();
        await fetchStudentData(); // Refresh current room allocations
      }
    } catch (err) {
      setSwapMessage({ type: 'error', text: err.response?.data?.message || 'Failed to respond to swap request' });
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-brand-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Room Swap Desk" />
          <main className="flex-grow p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Loading swap profile...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const profile = details?.profile || {};

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Room Swap Desk" />

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {error && (
            <div className="mb-6 p-4.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Send swap request form */}
            <div className="premium-card p-6 h-fit">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-brand-teal" />
                <h4 className="text-sm font-bold text-slate-800">Request Room Swap</h4>
              </div>
              
              {profile.status === 'Allocated' && profile.allocatedRoomId ? (
                <form onSubmit={handleSendSwapRequest} className="space-y-4">
                  {swapMessage.text && (
                    <div className={`p-3 rounded-lg text-xs font-bold border flex items-center gap-2 ${
                      swapMessage.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-250 text-emerald-600' 
                        : 'bg-rose-50 border-rose-200 text-rose-600'
                    }`}>
                      {swapMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                      <span>{swapMessage.text}</span>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed font-semibold">
                      To swap rooms, enter the institutional email address of the student you wish to swap with. Both students must be allocated rooms of the same gender block to qualify.
                    </p>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Classmate's Email Address</label>
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
                <div className="py-6 px-4 text-center text-slate-400 font-semibold text-xs leading-relaxed border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                  ⚠️ You must have an active room allocation block to request a room swap.
                </div>
              )}
            </div>

            {/* Active swap logs */}
            <div className="premium-card p-6 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="w-5 h-5 text-brand-teal" />
                <h4 className="text-sm font-bold text-slate-800">Room Swap Request Log</h4>
              </div>

              <div className="space-y-4">
                {swapRequests.length > 0 ? (
                  swapRequests.map(req => {
                    const isRequester = req.requesterId?._id === details?.profile?.userId;
                    const peerUser = isRequester ? req.targetStudentId : req.requesterId;
                    return (
                      <div key={req._id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition hover:bg-slate-50 duration-150">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {isRequester ? `Sent swap request to ${peerUser?.name}` : `Received swap request from ${peerUser?.name}`}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{peerUser?.email}</span>
                          <span className="text-[10px] font-semibold text-slate-400 mt-2 block">
                            Requested: {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${
                            req.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : req.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {req.status}
                          </span>
                          
                          {!isRequester && req.status === 'Pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRespondSwap(req._id, 'approve')}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRespondSwap(req._id, 'reject')}
                                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded font-bold text-[10px] uppercase tracking-wider cursor-pointer"
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
        </main>
      </div>
    </div>
  );
};

export default StudentSwap;
