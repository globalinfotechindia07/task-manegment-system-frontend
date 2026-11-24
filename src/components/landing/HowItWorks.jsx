import React from 'react';
import {
  HiOutlineBuildingOffice2,
  HiOutlineUserPlus,
  HiOutlinePlayCircle,
  HiOutlineDocumentArrowDown,
  HiOutlineArrowRight,
} from 'react-icons/hi2';

const STEPS = [
  {
    step: '01',
    title: 'Configure Office & Geofence',
    subtitle: 'Branch Setup in 2 Minutes',
    description:
      'Add your branches, office coordinates, and define GPS geofence radius (e.g. 150m) so employees can only punch in from verified work premises.',
    icon: HiOutlineBuildingOffice2,
    badge: 'Step 1: Setup',
  },
  {
    step: '02',
    title: 'Add Staff, Roles & CTC Salaries',
    subtitle: 'Automated Structure',
    description:
      'Assign roles (HR, Team Lead, Employee) with granular permissions. Configure CTC structures (Basic, HRA, PF 12%, ESIC, and PT) and late buffer rules.',
    icon: HiOutlineUserPlus,
    badge: 'Step 2: Onboard',
  },
  {
    step: '03',
    title: 'Daily Punch & Live Task Timers',
    subtitle: 'Zero-Proxy Execution',
    description:
      'Staff punch in via mobile within the geofence perimeter. Work timers track deliverables with real-time break reasons (Lunch, Tea, Meetings).',
    icon: HiOutlinePlayCircle,
    badge: 'Step 3: Execute',
  },
  {
    step: '04',
    title: 'Instant Slips & Excel/PDF Reports',
    subtitle: '1-Click Compliance',
    description:
      'Download monthly salary slips with automated late deductions, and export company-wide attendance registers & project work logs to Excel and PDF.',
    icon: HiOutlineDocumentArrowDown,
    badge: 'Step 4: Automate',
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/70 px-3.5 py-1.5 rounded-full border border-indigo-200">
            Rapid Implementation
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            How It Works: From Setup to Total Automation
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Get your company fully operational in under 15 minutes with our guided 4-step workflow.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="relative bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-indigo-200 group-hover:text-indigo-600 transition-colors">
                      {s.step}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {s.badge}
                    </span>
                  </div>

                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {s.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-indigo-600 mb-2">
                    {s.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-[11px] font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
                  <span>Seamless &amp; Automated</span>
                  <HiOutlineArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
