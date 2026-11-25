import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth, getRoleDashboard } from '../../context/AuthContext';
import {
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineBriefcase,
  HiOutlineClock,
  HiOutlineBanknotes,
  HiOutlineDocumentDuplicate,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineBuildingOffice2,
  HiOutlineTrash,
  HiOutlineKey,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

const DEMO_ACCOUNTS = [
  {
    roleKey: 'admin',
    roleLabel: 'Office Administrator',
    badge: 'Full Control',
    name: 'Alex Morgan',
    email: 'demo.admin@globalinfotech.com',
    password: 'demo123',
    icon: HiOutlineBuildingOffice2,
    accent: {
      border: 'border-indigo-200 hover:border-indigo-400',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      btn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200',
      iconBg: 'bg-indigo-100 text-indigo-600',
      glow: 'group-hover:shadow-indigo-500/10',
    },
    summary: 'Full administrative authority across all company branches, employee accounts, billing & global configurations.',
    capabilities: [
      'Multi-Branch & Shift Configuration',
      'Staff Directory & Custom RBAC Roles',
      'Company Invoicing & Plan Billing',
      'Full System Audit Logs & Diagnostics',
    ],
  },
  {
    roleKey: 'hr',
    roleLabel: 'HR Manager',
    badge: 'People Ops',
    name: 'Sarah Jenkins',
    email: 'demo.hr@globalinfotech.com',
    password: 'demo123',
    icon: HiOutlineUserGroup,
    accent: {
      border: 'border-emerald-200 hover:border-emerald-400',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-600',
      glow: 'group-hover:shadow-emerald-500/10',
    },
    summary: 'Complete human resources administration for attendance rules, leave approvals, documents and automated payslips.',
    capabilities: [
      'Geofenced Attendance & Grace Rules',
      'Leave Policies & Single-Click Approvals',
      'Dynamic Monthly Salary Slip Generation',
      'Company Announcements & Job Postings',
    ],
  },
  {
    roleKey: 'lead',
    roleLabel: 'Team Head / Project Lead',
    badge: 'Agile & Sprints',
    name: 'David Chen',
    email: 'demo.lead@globalinfotech.com',
    password: 'demo123',
    icon: HiOutlineBriefcase,
    accent: {
      border: 'border-blue-200 hover:border-blue-400',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
      iconBg: 'bg-blue-100 text-blue-600',
      glow: 'group-hover:shadow-blue-500/10',
    },
    summary: 'Lead engineering and product teams: delegate daily tasks, orchestrate sprints, and review member logged hours.',
    capabilities: [
      'Sprint Board & Milestone Tracking',
      'Daily Task Delegation to Team Members',
      'Member Stopwatch Timers & Timesheets',
      'Project Deliverable Status Approvals',
    ],
  },
  {
    roleKey: 'user',
    roleLabel: 'Employee / Engineer',
    badge: 'Daily Workflow',
    name: 'Rohan Verma',
    email: 'demo.user@globalinfotech.com',
    password: 'demo123',
    icon: HiOutlineClock,
    accent: {
      border: 'border-violet-200 hover:border-violet-400',
      badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
      btn: 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200',
      iconBg: 'bg-violet-100 text-violet-600',
      glow: 'group-hover:shadow-violet-500/10',
    },
    summary: 'Individual contributor experience: geofenced mobile punches, real-time task stopwatch, leaves & payslip vault.',
    capabilities: [
      'Geofenced Mobile Browser Punch In/Out',
      'Live Task Stopwatch Timer with Reasons',
      'Leave Balance & Sick/Casual Requests',
      'Instant Computerized Salary Slip Vault',
    ],
  },
  {
    roleKey: 'accountant',
    roleLabel: 'Accountant / Finance',
    badge: 'Payroll & Ledger',
    name: 'Priya Nair',
    email: 'demo.accountant@globalinfotech.com',
    password: 'demo123',
    icon: HiOutlineBanknotes,
    accent: {
      border: 'border-amber-200 hover:border-amber-400',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
      iconBg: 'bg-amber-100 text-amber-600',
      glow: 'group-hover:shadow-amber-500/10',
    },
    summary: 'Oversee corporate finance, Indian statutory tax calculations (EPF, ESI, PT), client invoicing and ledgers.',
    capabilities: [
      'Statutory Salary Structure Configurations',
      'PF (12%), ESI (0.75%), TDS & Overtime Rates',
      'Client Invoicing & Payment Tracking',
      'Payroll Audit Logs & Bank Export Sheets',
    ],
  },
  {
    roleKey: 'client',
    roleLabel: 'Client Portal Representative',
    badge: 'Client Portal',
    name: 'Elena Rostova',
    email: 'demo.client@globalinfotech.com',
    password: 'demo123',
    icon: HiOutlineShieldCheck,
    accent: {
      border: 'border-rose-200 hover:border-rose-400',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200',
      iconBg: 'bg-rose-100 text-rose-600',
      glow: 'group-hover:shadow-rose-500/10',
    },
    summary: 'Dedicated external client view: monitor project milestones, review deliverable files, and track invoice statuses.',
    capabilities: [
      'Real-Time Milestone Progress View',
      'Download Invoices & Payment Receipts',
      'Review Finished Deliverable Files',
      'Direct Support Queries & Tickets',
    ],
  },
];

const DemoCredentialsSection = () => {
  const [copiedKey, setCopiedKey] = useState(null);
  const [loggingInRole, setLoggingInRole] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied to clipboard: ${text}`, { id: 'copy-toast' });
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handle1ClickLogin = async (account) => {
    try {
      setLoggingInRole(account.roleKey);
      const res = await login(account.email, account.password);
      if (res.success && res.user) {
        toast.success(`Welcome to Demo Sandbox as ${account.roleLabel}!`);
        const targetPath = getRoleDashboard(res.user);
        navigate(targetPath, { replace: true });
      } else {
        toast.error(res.message || 'Demo login failed. Please try again.');
      }
    } catch (err) {
      toast.error('Could not authenticate demo account. Please check network.');
    } finally {
      setLoggingInRole(null);
    }
  };

  return (
    <section id="demo" className="py-16 sm:py-24 lg:py-28 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <HiOutlineSparkles className="w-4 h-4 text-indigo-300" />
            <span>Public Interactive Demo Sandbox</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Test Drive Real Accounts with{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              1-Click Instant Login
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed">
            Choose any pre-configured enterprise role below to explore live features immediately. No credit card, no sign-up form required.
          </p>
        </div>

        {/* 24-Hour Auto-Purge Security Notice Card */}
        <div className="max-w-4xl mx-auto mb-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 p-4 sm:p-6 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <HiOutlineTrash className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-white">
                🛡️ 24-Hour Rolling Sandbox Auto-Purge
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active &amp; Automated
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Any test tasks, punches, leaves, or sample files uploaded through demo accounts are{' '}
              <strong className="text-amber-300 font-semibold">automatically permanently purged within 24 hours</strong>. Real enterprise customer workspaces and production databases remain completely isolated and unaffected.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700">
            <HiOutlineKey className="w-4 h-4 text-amber-400" />
            <span>Shared Pass: <strong className="text-white">demo123</strong></span>
          </div>
        </div>

        {/* Demo Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            const isLoggingIn = loggingInRole === acc.roleKey;
            const emailCopied = copiedKey === `${acc.roleKey}-email`;
            const passCopied = copiedKey === `${acc.roleKey}-pass`;

            return (
              <div
                key={acc.roleKey}
                className={`group rounded-2xl bg-slate-850/90 border border-slate-700/80 hover:border-slate-500 transition-all duration-300 p-6 flex flex-col justify-between shadow-xl ${acc.accent.glow} relative`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${acc.accent.iconBg}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                          {acc.roleLabel}
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">{acc.name}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border tracking-wider uppercase ${acc.accent.badgeBg}`}>
                      {acc.badge}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                    {acc.summary}
                  </p>

                  {/* Capabilities List */}
                  <div className="mb-5 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Key Modules You Can Test:
                    </span>
                    {acc.capabilities.map((cap, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{cap}</span>
                      </div>
                    ))}
                  </div>

                  {/* Public Credentials Box */}
                  <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-750 mb-5 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">Email:</span>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="font-mono text-slate-200 text-[11px] truncate">{acc.email}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(acc.email, `${acc.roleKey}-email`)}
                          title="Copy Email ID"
                          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          {emailCopied ? (
                            <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <HiOutlineDocumentDuplicate className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-1.5">
                      <span className="text-slate-400 font-medium">Password:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-amber-300 text-[11px] font-bold">{acc.password}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(acc.password, `${acc.roleKey}-pass`)}
                          title="Copy Password"
                          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          {passCopied ? (
                            <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <HiOutlineDocumentDuplicate className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1-Click Launch Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => handle1ClickLogin(acc)}
                    disabled={isLoggingIn}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${acc.accent.btn} disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {isLoggingIn ? (
                      <>
                        <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                        <span>Signing in as {acc.roleLabel}...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡ Launch Live Demo</span>
                        <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center text-xs text-slate-400">
          <span>Need a customized on-premise or cloud deployment for your organization? </span>
          <a href="#contact" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
            Contact our Solutions Engineering Team
          </a>
        </div>
      </div>
    </section>
  );
};

export default DemoCredentialsSection;
