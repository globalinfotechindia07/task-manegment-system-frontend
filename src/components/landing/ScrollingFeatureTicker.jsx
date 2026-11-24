import React from 'react';
import {
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineBanknotes,
  HiOutlineDocumentArrowDown,
  HiOutlineChatBubbleLeftRight,
  HiOutlineVideoCamera,
  HiOutlineBuildingOffice2,
  HiOutlineShieldCheck,
  HiOutlineRocketLaunch,
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineBell,
  HiOutlineServer,
  HiOutlineCheckBadge,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const ROW_1_ITEMS = [
  {
    icon: HiOutlineMapPin,
    title: 'GPS Geofenced Punch',
    subtitle: '150m Radius Validation',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    icon: HiOutlineClock,
    title: 'Live Task Timers',
    subtitle: 'Lunch / Break Reasons',
    bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
  {
    icon: HiOutlineBanknotes,
    title: 'Dynamic Payroll',
    subtitle: 'PF 12% + ESIC + PT',
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    icon: HiOutlineDocumentArrowDown,
    title: 'Reports Export Hub',
    subtitle: 'Excel CSV & Print PDF',
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    icon: HiOutlineChatBubbleLeftRight,
    title: 'Real-Time Team Chat',
    subtitle: 'WebSocket Department Channels',
    bg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
  {
    icon: HiOutlineVideoCamera,
    title: 'Jitsi HD Video Meetings',
    subtitle: 'Encrypted 1-Click Conferences',
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  {
    icon: HiOutlineBuildingOffice2,
    title: 'Multi-Tenant Isolation',
    subtitle: 'Zero Data Cross-Leak',
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Role-Based RBAC',
    subtitle: 'Admin, HR, Lead, Staff, Client',
    bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  },
];

const ROW_2_ITEMS = [
  {
    icon: HiOutlineRocketLaunch,
    title: 'Sprints & Kanban',
    subtitle: 'Target Timeline Windows',
    bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  {
    icon: HiOutlineBriefcase,
    title: 'CRM Deals Pipeline',
    subtitle: 'Client Guest Self-Service',
    bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  },
  {
    icon: HiOutlineDocumentText,
    title: 'Digital Offer Letters',
    subtitle: 'Standardized Corporate Branding',
    bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
  {
    icon: HiOutlineBell,
    title: 'Live Push Notifications',
    subtitle: 'Instant Meeting & Task Alerts',
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    icon: HiOutlineServer,
    title: 'Cloud Database Backup',
    subtitle: 'Automated Daily Snapshots',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    icon: HiOutlineCheckBadge,
    title: '99.98% High Availability',
    subtitle: 'Enterprise SLA Guaranteed',
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    icon: HiOutlineSparkles,
    title: 'Late Buffer Rules',
    subtitle: '15-Min Grace Period Policy',
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
];

export const ScrollingFeatureTicker = () => {
  return (
    <div className="w-full bg-slate-950 py-8 sm:py-12 border-y border-slate-850 overflow-hidden relative select-none">
      {/* Left/Right Fade Gradient Masks */}
      <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

      {/* Row 1: Forward Marquee */}
      <div className="flex overflow-hidden py-1.5">
        <div className="animate-marquee flex gap-3 sm:gap-4 items-center shrink-0">
          {[...ROW_1_ITEMS, ...ROW_1_ITEMS].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 transition-all shadow-sm"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${item.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">{item.title}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{item.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2: Reverse Marquee */}
      <div className="flex overflow-hidden py-1.5 mt-2">
        <div className="animate-marquee-reverse flex gap-3 sm:gap-4 items-center shrink-0">
          {[...ROW_2_ITEMS, ...ROW_2_ITEMS].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-850 transition-all shadow-sm"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${item.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">{item.title}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{item.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScrollingFeatureTicker;
