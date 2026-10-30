import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const SuperAdminDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const { data } = await api.get('/companies/platform/stats');
      return data;
    }
  });

  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ['companiesSummary'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data;
    }
  });

  if (statsLoading || companiesLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const s = stats || {
    totalCompanies: 0,
    activeCompanies: 0,
    trialCompanies: 0,
    expiredCompanies: 0,
    totalUsers: 0,
    estimatedMonthlyRevenue: 0,
    totalPlans: 0
  };

  const statusPieData = [
    { name: 'Active', value: s.activeCompanies, color: '#10b981' },
    { name: 'Trial', value: s.trialCompanies, color: '#6366f1' },
    { name: 'Expired/Suspended', value: s.expiredCompanies, color: '#ef4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 p-6 lg:p-8 border border-indigo-500/20 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              SaaS Multi-Tenant Control Hub
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Platform Master Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Monitor multi-branch operations, manage company subscriptions, oversee employee allocations, and track recurring revenue.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/super-admin/offices"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Register New Office
            </Link>
            <Link
              to="/super-admin/plans"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Manage Plans
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Offices */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Offices</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{s.totalCompanies}</span>
            <span className="text-xs text-emerald-400 font-medium">{s.activeCompanies} active</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Tenant organizations on platform</p>
        </div>

        {/* Total Users / Seats */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Employees</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{s.totalUsers}</span>
            <span className="text-xs text-indigo-400 font-medium">Platform-wide</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Total provisioned employee seats</p>
        </div>

        {/* Estimated Monthly Revenue */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Est. Monthly Revenue</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">₹{s.estimatedMonthlyRevenue?.toLocaleString('en-IN')}</span>
            <span className="text-xs text-amber-400 font-medium">MRR</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">From active office subscriptions</p>
        </div>

        {/* Subscription Plans */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tiers & Plans</span>
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{s.totalPlans}</span>
            <span className="text-xs text-purple-400 font-medium">Active tiers</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Available packaging tiers</p>
        </div>
      </div>

      {/* Charts & Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="text-base font-semibold text-white mb-1">Office Subscription Health</h2>
          <p className="text-xs text-slate-400 mb-4">Breakdown of active vs expired/suspended accounts</p>

          <div className="h-64 flex items-center justify-center">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-sm">No data available</div>
            )}
          </div>

          <div className="flex justify-around mt-2 pt-4 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Active ({s.activeCompanies})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span className="text-slate-300">Trial ({s.trialCompanies})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-300">Expired ({s.expiredCompanies})</span>
            </div>
          </div>
        </div>

        {/* Recent Companies Overview */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Registered Offices</h2>
              <p className="text-xs text-slate-400 mt-0.5">Live list of organizations and employee allocation</p>
            </div>
            <Link
              to="/super-admin/offices"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
            >
              View All ({companies?.length || 0})
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/40 text-slate-400 text-xs uppercase font-medium">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Office & Code</th>
                  <th className="py-3 px-4">Admin</th>
                  <th className="py-3 px-4">Plan & Capacity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {companies?.slice(0, 5).map((comp) => {
                  const maxLimit = comp.subscription?.maxEmployees || 20;
                  const currentCount = comp.currentEmployeeCount || 0;
                  const usagePercent = Math.min(100, Math.round((currentCount / maxLimit) * 100));

                  return (
                    <tr key={comp._id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{comp.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-indigo-300">
                            {comp.companyCode}
                          </span>
                          <span>• {comp.location || 'Remote'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200">{comp.adminUser?.name || 'Unassigned'}</div>
                        <div className="text-xs text-slate-400">{comp.adminUser?.email || comp.contactEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium text-xs">
                          {comp.subscription?.planName || 'Standard'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${usagePercent >= 90 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                              style={{ width: `${usagePercent}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {currentCount}/{maxLimit}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            comp.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : comp.status === 'Suspended'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {comp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to="/super-admin/offices"
                          className="px-2.5 py-1 text-xs rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all font-medium"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
