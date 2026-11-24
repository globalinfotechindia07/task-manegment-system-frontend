import React, { useState } from 'react';
import {
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineBriefcase,
  HiOutlineUser,
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineBanknotes,
  HiOutlineDocumentArrowDown,
  HiOutlineArrowRight,
} from 'react-icons/hi2';

const ROLES = [
  {
    id: 'admin',
    name: 'Company Admin / CTO',
    badge: 'Multi-Tenant Authority',
    icon: HiOutlineBuildingOffice2,
    color: 'from-indigo-600 to-indigo-700',
    tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    headline: 'Total Control Over Branch Operations, Financials & Quotas',
    description:
      'Executive dashboard for branch oversight, company-wide payroll approvals, tenant segregation, custom role permission matrix (RBAC), and automated database backups.',
    features: [
      'Multi-branch geofencing & attendance policy configuration',
      'Real-time task reassignments & company-wide time logs audit',
      'One-click monthly salary disbursement & financial reports',
      'Automated cloud backups, restore controls & activity audit logs',
    ],
    mockupSummary: {
      stat1: '124 Active Users',
      stat2: '100% Branch Uptime',
      stat3: 'Zero Data Cross-Leak',
    },
  },
  {
    id: 'hr',
    name: 'HR Manager & Ops',
    badge: 'Workforce & Compliance',
    icon: HiOutlineUserGroup,
    color: 'from-emerald-600 to-emerald-700',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    headline: 'Effortless Attendance Policies, Leaves & Statutory Payroll',
    description:
      'Say goodbye to manual hazari calculations. Automated late deductions, paid leave management, offer letter generator, and instant computerized salary slips.',
    features: [
      'Automated late buffer tracking (e.g. 15-minute grace period)',
      'Statutory compliance deductions (PF 12%, ESIC 0.75%, PT)',
      'Digital offer letter issuance with standard company branding',
      'KYC document verification & employee onboarding portal',
    ],
    mockupSummary: {
      stat1: '25 Days Present Avg',
      stat2: '4 Late Marks Auto-Fined',
      stat3: '100% Onboarding Compliance',
    },
  },
  {
    id: 'lead',
    name: 'Team Leads & Managers',
    badge: 'Project Velocity',
    icon: HiOutlineBriefcase,
    color: 'from-violet-600 to-violet-700',
    tagColor: 'bg-violet-50 text-violet-700 border-violet-200',
    headline: 'Assign Deliverables, Track Live Timers & Sprint Progress',
    description:
      'Scoped task delegation to direct reports, live stopwatch supervision with break reasons, project milestone deadlines, and contribution reports ("Kisne kitna kaam kiya").',
    features: [
      'Assign tasks strictly to team members or self-assignment',
      'Live timer monitoring: inspect who is on break vs productive work',
      'Sprints and timeline milestone targets with overdue alerts',
      'Exportable project contribution breakdown (% share of hours)',
    ],
    mockupSummary: {
      stat1: '18 Sprints Active',
      stat2: '94% On-Time Delivery',
      stat3: 'Live Ticker Enabled',
    },
  },
  {
    id: 'employee',
    name: 'Employees & Staff',
    badge: 'Daily Productivity',
    icon: HiOutlineUser,
    color: 'from-blue-600 to-blue-700',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    headline: '1-Tap Mobile Punch-In, Self Tasks & Instant Salary Slips',
    description:
      'Seamless mobile experience for daily attendance, starting work timers with custom break reasons, requesting leaves, and downloading official salary slips on payday.',
    features: [
      'Geofenced mobile punch-in within branch GPS perimeter',
      'Daily tasks timer: Start, Pause (Lunch/Tea/Meeting), and End',
      'Leave application status and available balances tracker',
      'Download monthly salary slips PDF directly to phone or laptop',
    ],
    mockupSummary: {
      stat1: '1-Tap Punch In',
      stat2: 'Real-Time Break Log',
      stat3: 'Instant Slip PDF',
    },
  },
  {
    id: 'client',
    name: 'Corporate Clients',
    badge: 'Transparent Collaboration',
    icon: HiOutlineShieldCheck,
    color: 'from-teal-600 to-teal-700',
    tagColor: 'bg-teal-50 text-teal-700 border-teal-200',
    headline: 'Dedicated Client Portal for Deliverables & Invoices',
    description:
      'External clients get an isolated, secure portal to track real-time project progress, review milestones, verify deliverable completion, and download GST tax invoices.',
    features: [
      'Real-time milestone progress bar and deliverable reviews',
      'Zero access to internal company chats or confidential records',
      'Downloadable GST invoices and verified billing receipts',
      'Direct query support channel with designated account manager',
    ],
    mockupSummary: {
      stat1: '84% Milestone Progress',
      stat2: 'Transparent Billing',
      stat3: 'Direct Account Rep',
    },
  },
];

export const RoleWorkflows = () => {
  const [activeRole, setActiveRole] = useState(ROLES[0].id);
  const currentRole = ROLES.find((r) => r.id === activeRole) || ROLES[0];

  return (
    <section id="roles" className="py-16 sm:py-24 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-100">
            Tailored Experiences
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Designed for Every Stakeholder in Your Enterprise
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            One platform, personalized workspaces. See how each role in your organization gains efficiency from day one.
          </p>
        </div>

        {/* Role Selector Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 mb-8 no-scrollbar">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isActive = r.id === activeRole;
            return (
              <button
                key={r.id}
                onClick={() => setActiveRole(r.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{r.name}</span>
              </button>
            );
          })}
        </div>

        {/* Role Detail Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Info */}
            <div className="lg:col-span-7 space-y-4">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${currentRole.tagColor}`}>
                {currentRole.badge}
              </span>

              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-snug">
                {currentRole.headline}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {currentRole.description}
              </p>

              <div className="pt-2 space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Key Role Privileges:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentRole.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                      <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Visual KPI Mini-Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md shadow-slate-200/50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <currentRole.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{currentRole.name} Workspace</h4>
                      <p className="text-[10px] text-slate-400">Security &amp; Permissions Scoped</p>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 block">Scope</span>
                    <span className="text-xs font-bold text-slate-800 block mt-1">{currentRole.mockupSummary.stat1}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 block">Security</span>
                    <span className="text-xs font-bold text-emerald-600 block mt-1">{currentRole.mockupSummary.stat2}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 block">Outcome</span>
                    <span className="text-xs font-bold text-indigo-600 block mt-1">{currentRole.mockupSummary.stat3}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed font-medium">
                  💡 Every screen automatically filters data based on this user's assigned branch, permissions, and direct reporting hierarchy.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoleWorkflows;
