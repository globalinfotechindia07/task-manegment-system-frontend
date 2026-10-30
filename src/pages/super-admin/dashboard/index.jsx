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
  HiOutlineArrowRight,
  HiOutlineChartPie,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';

const SuperAdminDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const { data } = await api.get('/companies/platform/stats');
      return data;
    },
  });

  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ['companiesSummary'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data;
    },
  });

  if (statsLoading || companiesLoading) {
    return (
      <div className="flex justify-center items-center py-16 min-h-[400px]">
        <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
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
    totalPlans: 0,
  };

  const statusPieData = [
    { name: 'Active', value: s.activeCompanies, color: '#10b981' },
    { name: 'Trial', value: s.trialCompanies, color: '#6366f1' },
    { name: 'Expired/Suspended', value: s.expiredCompanies, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // KPI cards data-driven for consistency
  const kpiCards = [
    {
      label: 'Total Offices',
      value: s.totalCompanies,
      sub: `${s.activeCompanies} active`,
      subColor: 'text-emerald-600',
      icon: HiOutlineBuildingOffice2,
      iconBg: 'bg-indigo-50',
      iconBorder: 'border-indigo-200',
      iconColor: 'text-indigo-600',
      footer: 'Tenant organizations',
      topBorder: 'border-t-indigo-500',
    },
    {
      label: 'Active Employees',
      value: s.totalUsers,
      sub: 'Platform-wide',
      subColor: 'text-indigo-600',
      icon: HiOutlineUsers,
      iconBg: 'bg-emerald-50',
      iconBorder: 'border-emerald-200',
      iconColor: 'text-emerald-600',
      footer: 'Provisioned seats',
      topBorder: 'border-t-emerald-500',
    },
    {
      label: 'Est. Monthly Revenue',
      value: `₹${(s.estimatedMonthlyRevenue || 0).toLocaleString('en-IN')}`,
      sub: 'MRR',
      subColor: 'text-amber-600',
      icon: HiOutlineCurrencyRupee,
      iconBg: 'bg-amber-50',
      iconBorder: 'border-amber-200',
      iconColor: 'text-amber-600',
      footer: 'Active subscriptions',
      topBorder: 'border-t-amber-500',
    },
    {
      label: 'Tiers & Plans',
      value: s.totalPlans,
      sub: 'Active tiers',
      subColor: 'text-purple-600',
      icon: HiOutlineShieldCheck,
      iconBg: 'bg-purple-50',
      iconBorder: 'border-purple-200',
      iconColor: 'text-purple-600',
      footer: 'Packaging tiers',
      topBorder: 'border-t-purple-500',
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== WELCOME BANNER ===================== */}
      <div className="rounded-xl bg-white p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            Multi-Tenant Control Hub
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            Platform Master Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
            Monitor multi-branch operations, manage company subscriptions, oversee employee allocations, and track recurring revenue.
          </p>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 shrink-0">
          <Link
            to="/super-admin/offices"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm whitespace-nowrap"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Register Office
          </Link>
          <Link
            to="/super-admin/plans"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm transition-colors shadow-sm whitespace-nowrap"
          >
            <HiOutlineSquares2X2 className="w-4 h-4 text-slate-500" />
            Manage Plans
          </Link>
        </div>
      </div>

      {/* ===================== KPI CARDS ===================== */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-sm border-t-4 ${card.topBorder} flex flex-col justify-between hover:border-slate-300 transition-colors`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
                    {card.label}
                  </span>
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${card.iconBg} border ${card.iconBorder} flex items-center justify-center ${card.iconColor} shrink-0`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-900 font-mono truncate">
                    {card.value}
                  </span>
                  <span className={`text-[10px] sm:text-xs font-semibold ${card.subColor}`}>
                    {card.sub}
                  </span>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                {card.footer}
              </p>
            </div>
          );
        })}
      </div>

      {/* ===================== CHART + OFFICES TABLE ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* ---------- Subscription Health Pie ---------- */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <HiOutlineChartPie className="w-4 h-4" />
            </span>
            <span className="truncate">Subscription Health</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mb-3 sm:mb-4">
            Active vs expired / suspended accounts
          </p>

          <div className="h-56 sm:h-64 flex items-center justify-center">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      color: '#0f172a',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <HiOutlineChartPie className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-slate-600">No data available</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1 mt-2 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-700 font-medium truncate">
                Active ({s.activeCompanies})
              </span>
            </div>
            <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
              <span className="text-slate-700 font-medium truncate">
                Trial ({s.trialCompanies})
              </span>
            </div>
            <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-slate-700 font-medium truncate">
                Expired ({s.expiredCompanies})
              </span>
            </div>
          </div>
        </div>

        {/* ---------- Registered Offices Table ---------- */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Registered Offices
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Live organizations and employee allocation
              </p>
            </div>
            <Link
              to="/super-admin/offices"
              className="text-[11px] sm:text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1 whitespace-nowrap"
            >
              View All ({companies?.length || 0})
              <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!companies || companies.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <HiOutlineBuildingOffice2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">No offices registered</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Click &quot;Register Office&quot; to onboard your first tenant.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View (< md) */}
              <div className="md:hidden divide-y divide-slate-100 -mx-4 sm:-mx-6">
                {companies.slice(0, 5).map((comp) => {
                  const maxLimit = comp.subscription?.maxEmployees || 20;
                  const currentCount = comp.currentEmployeeCount || 0;
                  const usagePercent = Math.min(100, Math.round((currentCount / maxLimit) * 100));

                  return (
                    <div key={comp._id} className="p-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 text-xs truncate">
                            {comp.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[9px] text-indigo-700 border border-slate-200">
                              {comp.companyCode}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {comp.location || 'Remote'}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${comp.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : comp.status === 'Suspended'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                        >
                          {comp.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5">
                        <div className="min-w-0">
                          <span className="text-slate-500 block">Admin</span>
                          <span className="text-slate-800 font-medium truncate block">
                            {comp.adminUser?.name || 'Unassigned'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-slate-500 block">Plan</span>
                          <span className="text-slate-800 font-medium truncate block">
                            {comp.subscription?.planName || 'Standard'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 border border-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${usagePercent >= 90 ? 'bg-rose-500' : 'bg-indigo-600'
                                  }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">
                              {currentCount}/{maxLimit}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        to="/super-admin/offices"
                        className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors font-semibold"
                      >
                        Manage
                        <HiOutlineArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table (md+) */}
              <div className="hidden md:block overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
                <table className="w-full text-left text-sm text-slate-700 min-w-[700px]">
                  <thead className="bg-slate-50 text-slate-700 text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 lg:px-4 font-semibold whitespace-nowrap">Office & Code</th>
                      <th className="py-3 px-3 lg:px-4 font-semibold whitespace-nowrap">Admin</th>
                      <th className="py-3 px-3 lg:px-4 font-semibold whitespace-nowrap">Plan & Capacity</th>
                      <th className="py-3 px-3 lg:px-4 font-semibold whitespace-nowrap">Status</th>
                      <th className="py-3 px-3 lg:px-4 font-semibold text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {companies.slice(0, 5).map((comp) => {
                      const maxLimit = comp.subscription?.maxEmployees || 20;
                      const currentCount = comp.currentEmployeeCount || 0;
                      const usagePercent = Math.min(100, Math.round((currentCount / maxLimit) * 100));

                      return (
                        <tr key={comp._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 lg:px-4">
                            <div className="font-semibold text-slate-900 text-xs truncate max-w-[180px]">
                              {comp.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[9px] text-indigo-700 border border-slate-200 whitespace-nowrap">
                                {comp.companyCode}
                              </span>
                              <span className="truncate">• {comp.location || 'Remote'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 lg:px-4">
                            <div className="text-slate-900 font-medium text-xs truncate max-w-[120px]">
                              {comp.adminUser?.name || 'Unassigned'}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                              {comp.adminUser?.email || comp.contactEmail}
                            </div>
                          </td>
                          <td className="py-3 px-3 lg:px-4">
                            <div className="text-slate-900 font-medium text-xs whitespace-nowrap">
                              {comp.subscription?.planName || 'Standard'}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-16 lg:w-20 bg-slate-100 border border-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${usagePercent >= 90 ? 'bg-rose-500' : 'bg-indigo-600'
                                    }`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                                {currentCount}/{maxLimit}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 lg:px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${comp.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : comp.status === 'Suspended'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                            >
                              {comp.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 lg:px-4 text-right whitespace-nowrap">
                            <Link
                              to="/super-admin/offices"
                              className="px-2.5 py-1 text-[11px] rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors font-semibold inline-block"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;