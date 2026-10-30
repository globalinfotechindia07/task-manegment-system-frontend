import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  HiOutlineBuildingOffice2,
  HiOutlineUsers,
  HiOutlineCurrencyRupee,
  HiOutlineShieldCheck,
  HiOutlinePlus,
  HiOutlineSquares2X2,
  HiOutlineArrowRight
} from 'react-icons/hi2';
import api from '../../../api/axios';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
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
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
      <div className="rounded-xl bg-white p-6 lg:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            Multi-Tenant Control Hub
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            Platform Master Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Monitor multi-branch operations, manage company subscriptions, oversee employee allocations, and track recurring revenue.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/super-admin/offices"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-xs"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Register New Office
          </Link>
          <Link
            to="/super-admin/plans"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-sm transition-colors shadow-xs"
          >
            <HiOutlineSquares2X2 className="w-4 h-4 text-slate-500" />
            Manage Plans
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Offices */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Offices</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <HiOutlineBuildingOffice2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{s.totalCompanies}</span>
            <span className="text-xs text-emerald-600 font-semibold">{s.activeCompanies} active</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Tenant organizations on platform</p>
        </div>

        {/* Total Users / Seats */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Employees</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <HiOutlineUsers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{s.totalUsers}</span>
            <span className="text-xs text-indigo-600 font-semibold">Platform-wide</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Total provisioned employee seats</p>
        </div>

        {/* Estimated Monthly Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Est. Monthly Revenue</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <HiOutlineCurrencyRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">₹{s.estimatedMonthlyRevenue?.toLocaleString('en-IN')}</span>
            <span className="text-xs text-amber-600 font-semibold">MRR</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">From active office subscriptions</p>
        </div>

        {/* Subscription Plans */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tiers & Plans</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <HiOutlineShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{s.totalPlans}</span>
            <span className="text-xs text-purple-600 font-semibold">Active tiers</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Available packaging tiers</p>
        </div>
      </div>

      {/* Charts & Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Office Subscription Health</h2>
          <p className="text-xs text-slate-500 mb-4">Breakdown of active vs expired/suspended accounts</p>

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
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm">No data available</div>
            )}
          </div>

          <div className="flex justify-around mt-2 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-700 font-medium">Active ({s.activeCompanies})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span className="text-slate-700 font-medium">Trial ({s.trialCompanies})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-700 font-medium">Expired ({s.expiredCompanies})</span>
            </div>
          </div>
        </div>

        {/* Recent Companies Overview */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registered Offices</h2>
              <p className="text-xs text-slate-500 mt-0.5">Live list of organizations and employee allocation</p>
            </div>
            <Link
              to="/super-admin/offices"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
            >
              View All ({companies?.length || 0})
              <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Office & Code</th>
                  <th className="py-3 px-4 font-semibold">Admin</th>
                  <th className="py-3 px-4 font-semibold">Plan & Capacity</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies?.slice(0, 5).map((comp) => {
                  const maxLimit = comp.subscription?.maxEmployees || 20;
                  const currentCount = comp.currentEmployeeCount || 0;
                  const usagePercent = Math.min(100, Math.round((currentCount / maxLimit) * 100));

                  return (
                    <tr key={comp._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{comp.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-indigo-700 border border-slate-200">
                            {comp.companyCode}
                          </span>
                          <span>• {comp.location || 'Remote'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-900 font-medium text-xs">{comp.adminUser?.name || 'Unassigned'}</div>
                        <div className="text-xs text-slate-500">{comp.adminUser?.email || comp.contactEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-900 font-medium text-xs">
                          {comp.subscription?.planName || 'Standard'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 bg-slate-100 border border-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${usagePercent >= 90 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                              style={{ width: `${usagePercent}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {currentCount}/{maxLimit}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            comp.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : comp.status === 'Suspended'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {comp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to="/super-admin/offices"
                          className="px-2.5 py-1 text-xs rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors font-medium inline-block"
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