import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import api from '../utils/api';
import {
  Users,
  Building,
  Home,
  Percent,
  Clock,
  AlertOctagon,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/allocation/metrics');
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const PIE_COLORS = ['#14B8A6', '#F59E0B', '#64748B'];
  const RISK_COLORS = ['#22C55E', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="flex h-screen bg-brand-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Overview Dashboard" />
          <main className="flex-grow p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Loading system metrics...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const kpis = metrics?.kpis || {};
  const charts = metrics?.charts || {};

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Overview Dashboard" />

        <main className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">
              {error}
            </div>
          )}

          {/* Metric KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Students */}
            <div className="premium-card p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Students</span>
                <h3 className="text-2xl font-bold text-brand-dark mt-1">{kpis.totalStudents || 0}</h3>
                <span className="text-xs text-slate-400 mt-2 block">Registered Profiles</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-brand-dark">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Total Hostels */}
            <div className="premium-card p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Hostels</span>
                <h3 className="text-2xl font-bold text-brand-dark mt-1">{kpis.totalHostels || 0}</h3>
                <span className="text-xs text-slate-400 mt-2 block">Gender Segregated</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-brand-dark">
                <Building className="w-6 h-6" />
              </div>
            </div>

            {/* Total Rooms / Capacity */}
            <div className="premium-card p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Occupancy Rate</span>
                <h3 className="text-2xl font-bold text-brand-dark mt-1">{kpis.occupancyRate || 0}%</h3>
                <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-brand-teal h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, kpis.occupancyRate || 0)}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-brand-dark">
                <Percent className="w-6 h-6" />
              </div>
            </div>

            {/* Waitlist Queue & Complaints */}
            <div className="premium-card p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Waitlist Count</span>
                <h3 className="text-2xl font-bold text-brand-dark mt-1">{kpis.waitlistCount || 0}</h3>
                <span className="text-xs text-slate-400 mt-2 block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-brand-warning shrink-0" />
                  {kpis.openComplaintsCount || 0} Open Conflicts
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-brand-dark">
                <AlertOctagon className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Hostel Occupancy (Bar) */}
            <div className="premium-card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-sm font-semibold text-brand-dark">Hostel Capacity vs Occupancy</h4>
                  <p className="text-xs text-slate-400">Comparison across gender blocks</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-500 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-brand-teal" />
                  Live Spaces
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts.hostelOccupancy || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff' }} 
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    <Bar dataKey="capacity" name="Max Capacity" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="occupied" name="Occupied Space" fill="#14B8A6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Allocation Status (Pie) */}
            <div className="premium-card p-6">
              <h4 className="text-sm font-semibold text-brand-dark mb-1">Allocation Status</h4>
              <p className="text-xs text-slate-400 mb-6">Proportion of student placement</p>
              
              <div className="h-56 relative flex items-center justify-center">
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Dynamic Inner Text */}
                <div className="absolute text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Allocated</span>
                  <span className="text-2xl font-bold text-brand-dark">{kpis.totalOccupied || 0}</span>
                </div>
              </div>

              {/* Legends list */}
              <div className="mt-4 space-y-2">
                {(charts.allocationDistribution || []).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                      <span className="text-slate-500 font-medium">{item.name}</span>
                    </div>
                    <span className="font-semibold text-brand-dark">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Conflict Risks breakdown */}
            <div className="premium-card p-6 lg:col-span-1">
              <h4 className="text-sm font-semibold text-brand-dark mb-1">Student Conflict Risk Profile</h4>
              <p className="text-xs text-slate-400 mb-6">Aggregated from historical records</p>
              
              <div className="h-56 relative">
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-2">
                {(charts.conflictRiskDistribution || []).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RISK_COLORS[index % RISK_COLORS.length] }}></div>
                      <span className="text-slate-500 font-medium">{item.name}</span>
                    </div>
                    <span className="font-semibold text-brand-dark">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions & Seeder */}
            <div className="premium-card p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-brand-dark mb-1">Developer & Admin Operations</h4>
                <p className="text-xs text-slate-400 mb-4">Quick tools for system testing</p>
                
                <div className="border border-slate-100 rounded-lg p-4 bg-slate-50 text-xs text-slate-500 space-y-2 mb-6">
                  <p>💡 <strong>Seeding Data:</strong> To run allocation tests with full mock data, use the seeder script first by executing <code>node utils/seeder.js</code> inside the backend folder.</p>
                  <p>💡 <strong>Roommate Matching:</strong> Use the Allocation Engine tab in the sidebar to configure rules, rank students, and trigger roommate pairings via Graph algorithms.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={fetchMetrics}
                  className="btn-secondary flex-1 py-2 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Sync System Metrics
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
