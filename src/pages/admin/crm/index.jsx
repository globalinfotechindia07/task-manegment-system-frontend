import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiOutlinePresentationChartBar,
  HiOutlineBuildingStorefront,
  HiOutlinePlus,
  HiOutlineArrowRight,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineFunnel,
  HiOutlineArrowPath,
  HiOutlineSparkles,
  HiOutlineCurrencyRupee,
} from 'react-icons/hi2';
import api from '../../../api/axios';

const CRMOverview = () => {
  // Fetch CRM stats
  const { data: crmData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['crmStats'],
    queryFn: async () => {
      const { data } = await api.get('/crm/stats');
      return data;
    },
  });

  // Fetch recent leads
  const { data: leads = [] } = useQuery({
    queryKey: ['recentLeads'],
    queryFn: async () => {
      const { data } = await api.get('/crm/leads');
      return data.slice(0, 5);
    },
  });

  // Fetch recent deals
  const { data: deals = [] } = useQuery({
    queryKey: ['recentDeals'],
    queryFn: async () => {
      const { data } = await api.get('/crm/deals');
      return data.slice(0, 5);
    },
  });

  const stats = crmData?.stats || {
    totalLeads: 0,
    activePipelineValue: 0,
    activeDealsCount: 0,
    wonRevenue: 0,
    wonDealsCount: 0,
    winRate: 0,
    totalCustomers: 0,
    leadsByStatus: {},
    leadsBySource: {},
  };

  const stageCounts = crmData?.stageCounts || {
    Discovery: 0,
    Proposal: 0,
    Negotiation: 0,
    'Closed Won': 0,
    'Closed Lost': 0,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[400px]">
        <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              CRM & Sales Performance
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Live Sales Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your sales pipeline, track prospective customer inquiries, and accelerate revenue conversion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            title="Refresh CRM Data"
          >
            <HiOutlineArrowPath className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <Link
            to="/admin/crm/leads"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <HiOutlineUserGroup className="w-4 h-4 text-slate-500" />
            <span>Manage Leads</span>
          </Link>

          <Link
            to="/admin/crm/deals"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <HiOutlinePresentationChartBar className="w-4 h-4" />
            <span>Pipeline Board</span>
          </Link>
        </div>
      </div>

      {/* ===================== METRIC CARDS ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Leads */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-700">
              <HiOutlineUserGroup className="w-4 h-4 text-indigo-600" />
              Total Inquiries & Leads
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              {stats.leadsByStatus?.New || 0} New
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            {stats.totalLeads}
          </div>
          <div className="pt-2 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Qualified: <strong className="text-slate-800">{stats.leadsByStatus?.Qualified || 0}</strong></span>
            <Link to="/admin/crm/leads" className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5">
              View all <HiOutlineArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Active Pipeline Value */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-700">
              <HiOutlinePresentationChartBar className="w-4 h-4 text-amber-600" />
              Active Pipeline Value
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {stats.activeDealsCount} Deals
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            ₹{stats.activePipelineValue.toLocaleString('en-IN')}.00
          </div>
          <div className="pt-2 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>In negotiation: <strong className="text-slate-800">{stageCounts.Negotiation || 0}</strong></span>
            <Link to="/admin/crm/deals" className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5">
              Pipeline <HiOutlineArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Closed Won Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-700">
              <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600" />
              Closed Won Revenue
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {stats.wonDealsCount} Won Deals
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-tight">
            ₹{stats.wonRevenue.toLocaleString('en-IN')}.00
          </div>
          <div className="pt-2 mt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Win Rate: <strong className="text-emerald-700">{stats.winRate}%</strong></span>
            <span className="text-slate-400">Converted Deals</span>
          </div>
        </div>

        {/* Customer Accounts */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-700">
              <HiOutlineBuildingStorefront className="w-4 h-4 text-slate-500" />
              Customer Accounts
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Client Base
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            {stats.totalCustomers} Accounts
          </div>
          <div className="pt-2 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Active Clients</span>
            <Link to="/admin/crm/customers" className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5">
              Directory <HiOutlineArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ===================== PIPELINE & SOURCES BREAKDOWN ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline Stage Funnel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Pipeline Stages Distribution</h3>
              <p className="text-xs text-slate-500">Active opportunities currently moving through your sales funnel</p>
            </div>
            <Link to="/admin/crm/deals" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View Board →
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { name: 'Discovery & Initial Contact', count: stageCounts.Discovery, color: 'bg-blue-500' },
              { name: 'Proposal Sent & Demo', count: stageCounts.Proposal, color: 'bg-amber-500' },
              { name: 'Under Negotiation', count: stageCounts.Negotiation, color: 'bg-purple-500' },
              { name: 'Closed Won (Converted)', count: stageCounts['Closed Won'], color: 'bg-emerald-500' },
              { name: 'Closed Lost', count: stageCounts['Closed Lost'], color: 'bg-rose-400' },
            ].map((stage) => {
              const total = stats.totalDeals || 1;
              const percent = Math.round((stage.count / total) * 100);
              return (
                <div key={stage.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{stage.name}</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {stage.count} deal{stage.count !== 1 ? 's' : ''} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-300`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Sources Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Leads by Acquisition Channel</h3>
              <p className="text-xs text-slate-500">Where your prospective clients and inbound leads originate</p>
            </div>
            <Link to="/admin/crm/leads" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View Leads →
            </Link>
          </div>

          {Object.keys(stats.leadsBySource || {}).length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No lead source data available yet. Create your first lead to see channel breakdown.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.entries(stats.leadsBySource).map(([source, count]) => (
                <div
                  key={source}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between"
                >
                  <span className="text-[11px] font-semibold text-slate-600 truncate">{source}</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-black text-slate-900 font-mono">{count}</span>
                    <span className="text-[10px] text-slate-400">leads</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===================== PARALLEL PREVIEWS: RECENT LEADS & RECENT DEALS ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Inquiries & Leads */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiOutlineUserGroup className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Recent Leads & Inquiries</h3>
            </div>
            <Link to="/admin/crm/leads" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View All ({stats.totalLeads}) →
            </Link>
          </div>

          {leads.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No inquiries registered yet. Click &apos;Manage Leads&apos; to add one.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {leads.map((lead) => (
                <div key={lead._id} className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{lead.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {lead.companyName || 'Individual'} • Source: {lead.source}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 text-right">
                    <div>
                      <div className="font-mono font-bold text-slate-900">
                        ₹{Number(lead.value || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="inline-block px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {lead.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* High-Value Opportunities */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiOutlinePresentationChartBar className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">Active Sales Opportunities</h3>
            </div>
            <Link to="/admin/crm/deals" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Pipeline View →
            </Link>
          </div>

          {deals.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No sales deals created yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {deals.map((deal) => (
                <div key={deal._id} className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{deal.title}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Client: {deal.clientCompany || deal.clientName}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 text-right">
                    <div>
                      <div className="font-mono font-bold text-emerald-700">
                        ₹{Number(deal.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="inline-block px-2 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {deal.stage}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CRMOverview;

