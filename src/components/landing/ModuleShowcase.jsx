import React, { useState } from 'react';
import {
  HiOutlineSquares2X2,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineBanknotes,
  HiOutlineDocumentArrowDown,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineStop,
  HiOutlineVideoCamera,
  HiOutlineBuildingOffice2,
  HiOutlineArrowDownTray,
  HiOutlinePrinter,
  HiOutlineUserGroup,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineChevronRight,
  HiOutlineFingerPrint,
  HiOutlineCalendarDays,
  HiOutlineCheck,
} from 'react-icons/hi2';

export const MODULES_DATA = [
  {
    id: 'dashboard',
    name: 'Executive Dashboard',
    tag: 'Real-Time Intelligence',
    icon: HiOutlineSquares2X2,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    title: 'Central Command Center & Executive Overview',
    subtitle:
      'Complete 360° visibility into branch attendance, monthly payroll disbursement, active project sprints, and team productivity in real time.',
    whatIsIt:
      'Yeh software ka main control hub hai jahan Admin aur Management ko company ka har single metric ek nazar me dikhta hai. Alag-alag tools kholne ki zaroorat nahi hai.',
    keyPoints: [
      'Multi-branch aggregated headcount & real-time presence rate.',
      'Live financial summary: Monthly CTC budget vs disbursed payroll.',
      'Active sprint velocity, delayed deliverables & overdue tasks alert.',
      'One-click quick actions for punch, task creation, and approval requests.',
    ],
    roles: ['Super Admin', 'Company Admin', 'CTO', 'HR Manager'],
    previewType: 'dashboard',
  },
  {
    id: 'attendance',
    name: 'Geofenced Attendance',
    tag: 'GPS + Selfie Validation',
    icon: HiOutlineMapPin,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    title: 'Smart Geofenced Mobile Punch & Presence Tracking',
    subtitle:
      'Eliminate buddy punching and proxy attendance with automatic GPS radius perimeter checks, camera capture, and intelligent late buffer policies.',
    whatIsIt:
      'Employees office radius ke andar hone par hi mobile ya laptop se Punch In kar sakte hain. System GPS verify karta hai, selfie leta hai, aur automatic late mark calculate karta hai.',
    keyPoints: [
      'Configurable office geofence perimeter (e.g. 150m radius) per branch.',
      'Automatic late buffer rule (15 mins grace time, auto deduction rules).',
      'Daily punch in/out timestamps with exact working hours computation.',
      'Leave management integration: casual, sick, and earned leave deductions.',
    ],
    roles: ['All Staff', 'HR Manager', 'Team Head'],
    previewType: 'attendance',
  },
  {
    id: 'tasks',
    name: 'Tasks & Live Work Timer',
    tag: 'Precision Time Tracking',
    icon: HiOutlineClock,
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
    title: 'Task Management with Live Timer & Pause Reasons',
    subtitle:
      'Task assignments strictly scoped by role, target timeline windows, and live stopwatch tracking with mandatory break reasons (Lunch, Tea, Meeting).',
    whatIsIt:
      'Staff ko mile tasks ka exact time track hota hai. Employee ya Admin start timer karte hain, break lete waqt Lunch/Meeting reason select karte hain, aur exact productive hours system me log hote hain.',
    keyPoints: [
      'Role-based task assignment: Users self-assign, Leads assign to direct reports, Admins assign company-wide.',
      'Start, Pause, Resume, End controls directly in task tables & cards.',
      'Mandatory pause reasons: Lunch Break, Tea Break, Client Call, Network Issue.',
      'Target timeline vs actual productive time comparison with delay alerts.',
    ],
    roles: ['Assignees', 'Team Leads', 'Project Managers', 'Admin'],
    previewType: 'tasks',
  },
  {
    id: 'payroll',
    name: 'Dynamic Payroll & Slips',
    tag: 'Statutory Compliant',
    icon: HiOutlineBanknotes,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    title: 'Automated Salary Calculations & Downloadable Slips',
    subtitle:
      'Compute monthly payroll dynamically from attendance logs, working days, overtime, PF (12%), ESIC (0.75%), PT, and late mark deductions.',
    whatIsIt:
      'HR aur Accountant ko excel me formula lagane ki zaroorat nahi. Hazari aur policy ke hisab se net salary auto calculate hoti hai aur employee direct computerized salary slip download kar sakte hain.',
    keyPoints: [
      'Customizable CTC salary structure: Basic, HRA, DA, Special Allowances.',
      'Indian statutory compliance: PF 12%, ESIC 0.75%, Professional Tax (PT).',
      'Automated late penalty deductions based on office attendance policy.',
      'One-click PDF salary slip generation with company stamp and signature block.',
    ],
    roles: ['HR Manager', 'Accountant', 'Admin', 'Employees'],
    previewType: 'payroll',
  },
  {
    id: 'reports',
    name: 'Reports & Export Hub',
    tag: 'Excel CSV + Printable PDF',
    icon: HiOutlineDocumentArrowDown,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    title: 'Enterprise Reports Download & Work Analytics',
    subtitle:
      'Filter and download detailed month-wise Attendance Registers, Payroll Deductions, and "Kisne Kitna Kaam Kiya" Project Contribution reports.',
    whatIsIt:
      'Ek dedicated export module jahan se Attendance (Hazari), Salary slips register, aur Project me har member ka % contribution (productive hours) instant Excel aur PDF me export hota hai.',
    keyPoints: [
      'Attendance Report: Company-wide register ya individual employee ka day-by-day punch log.',
      'Salary Report: Gross earnings, late fine deductions, PF, ESIC, aur Net in-hand pay.',
      'Project Work Report: "Kisne kitna kaam kiya" % work contribution aur productive hours.',
      'Export engines: RFC 4180 Excel CSV (UTF-8 BOM) aur high-resolution print PDF.',
    ],
    roles: ['Admin', 'HR Manager', 'Team Lead', 'Accountant'],
    previewType: 'reports',
  },
  {
    id: 'collaboration',
    name: 'Chat & HD Video Meetings',
    tag: 'Real-Time Sync',
    icon: HiOutlineChatBubbleLeftRight,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    title: 'Real-Time Team Messaging & Video Conferences',
    subtitle:
      'Seamless communication built into your workspace. Direct messages, group channels, document sharing, and instant browser-based HD video meetings.',
    whatIsIt:
      'Slack ya Zoom ki tarah company ka internal communication system. Instant messages bhejo, files share karo, aur bina third-party link ke one-click HD video meeting room join karo.',
    keyPoints: [
      'WebSocket real-time chat with online status and unread badge counters.',
      'Department channels (#engineering, #sales, #announcements) and 1-on-1 chats.',
      'Integrated HD video conference rooms with screen sharing and end-to-end privacy.',
      'Meeting invitations broadcasted live to participants via desktop notifications.',
    ],
    roles: ['All Employees', 'Team Leads', 'Management', 'Clients'],
    previewType: 'collaboration',
  },
  {
    id: 'crm',
    name: 'CRM & Client Portal',
    tag: 'Revenue & Transparency',
    icon: HiOutlineBriefcase,
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    title: 'Deals Pipeline & Dedicated Client Self-Service Portal',
    subtitle:
      'Track sales leads through deal stages, share real-time sprint deliverables with external clients, and automate invoice payments.',
    whatIsIt:
      'Sales team ke liye lead and deal pipeline hai, aur aapke corporate clients ke liye ek dedicated portal jahan wo apne project ki progress, tasks, deliverables aur bills dekh sakte hain.',
    keyPoints: [
      'Kanban sales pipeline: Leads, Proposals, Negotiations, and Closed Won.',
      'Client Portal: Isolated guest login for project tracking and feedback.',
      'Invoice management with GST breakdown and payment status.',
      'Real-time sprint progress visible to clients without sharing internal chats.',
    ],
    roles: ['Sales Team', 'Account Managers', 'Corporate Clients', 'Admin'],
    previewType: 'crm',
  },
];

/* ============================================================
   REALISTIC APP UI MOCKUPS / SCREENSHOTS
   ============================================================ */
const AppPreviewFrame = ({ previewType }) => {
  return (
    <div className="w-full rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-800">
      {/* OS Browser / Window Topbar */}
      <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          <span className="ml-3 text-[11px] font-mono text-slate-400 hidden sm:inline-block">
            app.globalinfotech.com/{previewType}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Cloud
          </span>
        </div>
      </div>

      {/* Main Mockup Screen Content */}
      <div className="p-3 sm:p-5 bg-slate-100 min-h-[380px] sm:min-h-[440px] flex flex-col justify-start text-left text-xs">
        {/* 1. DASHBOARD PREVIEW */}
        {previewType === 'dashboard' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Global Infotech (Mumbai HQ)</h4>
                <p className="text-[10px] text-slate-500">Super Admin &amp; Branch Overview • November 2026</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                124 / 130 Seats Active
              </span>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 block">Today's Attendance</span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-600 block mt-0.5">95.2%</span>
                <span className="text-[9px] text-slate-400">118 Present • 6 On Leave</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 block">Monthly Payroll</span>
                <span className="text-base sm:text-lg font-extrabold text-indigo-600 block mt-0.5">₹24,80,000</span>
                <span className="text-[9px] text-slate-400">100% Disbursed</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 block">Active Tasks</span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 block mt-0.5">38 Ongoing</span>
                <span className="text-[9px] text-emerald-600 font-bold">92% on timeline</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 block">Pending Approvals</span>
                <span className="text-base sm:text-lg font-extrabold text-amber-600 block mt-0.5">4 Requests</span>
                <span className="text-[9px] text-slate-400">Leaves &amp; Overtime</span>
              </div>
            </div>

            {/* Bottom Split: Presence Chart + Quick Punch */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2 bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-[11px]">Weekly Attendance Trends</span>
                  <span className="text-[10px] text-indigo-600 font-bold">Mon - Sat</span>
                </div>
                <div className="h-24 flex items-end justify-between gap-2 px-2 pt-2 border-b border-slate-100">
                  {['Mon 96%', 'Tue 98%', 'Wed 94%', 'Thu 97%', 'Fri 95%', 'Sat 90%'].map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-indigo-500 hover:bg-indigo-600 transition-all"
                        style={{ height: `${[78, 86, 72, 84, 80, 68][idx]}%` }}
                      />
                      <span className="text-[8px] text-slate-400 font-medium">{item.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-indigo-200 font-bold">My Quick Action</span>
                  <p className="font-bold text-xs mt-0.5">Today: Punched In</p>
                  <p className="text-[10px] text-indigo-100 font-mono mt-1">09:12 AM (HQ Geofence)</p>
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 text-white text-[10px] font-bold backdrop-blur-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Duty Duration: 5h 28m
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ATTENDANCE PREVIEW */}
        {previewType === 'attendance' && (
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <HiOutlineMapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xs">Powai Tech Park Perimeter • Branch A</p>
                  <p className="text-[10px] text-slate-500">Allowed Radius: 150m • Geofence Active</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold self-start sm:self-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                GPS Verified (Within Range)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Radar & Face validation simulation */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden py-5">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin flex items-center justify-center mb-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <HiOutlineFingerPrint className="w-8 h-8" />
                  </div>
                </div>
                <p className="font-bold text-slate-800 text-[11px]">Coordinates: 19.1176° N, 72.9060° E</p>
                <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">Distance from office center: 32 meters ✅</p>
                <div className="mt-3 flex gap-2">
                  <button className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px] shadow-xs">
                    Punch In (09:15 AM)
                  </button>
                  <button className="px-3 py-1 bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px]">
                    Punch Out
                  </button>
                </div>
              </div>

              {/* Punch register breakdown */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-[11px] block border-b border-slate-100 pb-1">
                  Today's Punch Log
                </span>
                <div className="flex justify-between items-center text-[10px] py-1 border-b border-slate-50">
                  <span className="text-slate-500">First Punch-In:</span>
                  <span className="font-mono font-bold text-emerald-600">09:12 AM</span>
                </div>
                <div className="flex justify-between items-center text-[10px] py-1 border-b border-slate-50">
                  <span className="text-slate-500">Late Status:</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">On Time (0 min late)</span>
                </div>
                <div className="flex justify-between items-center text-[10px] py-1 border-b border-slate-50">
                  <span className="text-slate-500">Grace Buffer Allowed:</span>
                  <span className="text-slate-700 font-medium">15 Minutes</span>
                </div>
                <div className="flex justify-between items-center text-[10px] py-1">
                  <span className="text-slate-500">Expected Checkout:</span>
                  <span className="font-mono font-bold text-indigo-700">06:15 PM (9h Shift)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. TASKS & TIMER PREVIEW */}
        {previewType === 'tasks' && (
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Project: Pinack Backend API</span>
                <h4 className="font-bold text-slate-900 text-xs">Payment Gateway Webhook Sync &amp; Testing</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                High Priority
              </span>
            </div>

            {/* Live Timer Control Card */}
            <div className="bg-white p-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-slate-900">Work Timer Live Running</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-mono font-extrabold text-indigo-700">01:42:15</span>
                    <span className="text-[10px] text-slate-500">Target Target: 4h • Total: 3d</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs hover:bg-amber-600">
                    <HiOutlinePause className="w-3.5 h-3.5 stroke-[2.5]" />
                    Pause (Break)
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs hover:bg-rose-700">
                    <HiOutlineStop className="w-3.5 h-3.5" />
                    End Session
                  </button>
                </div>
              </div>

              {/* Pause reason badges */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] text-slate-400 uppercase font-bold">Preset Reasons:</span>
                {['Lunch Break', 'Tea / Coffee Break', 'Team Meeting', 'Client Call', 'System Issue'].map((r, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 font-medium">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Task Table Preview Row */}
            <div className="bg-white rounded-xl border border-slate-200 p-2.5 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-800">Assignee: Dinesh Tawade (Self Only)</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                In Progress • 1d Overdue Alert
              </span>
            </div>
          </div>
        )}

        {/* 4. PAYROLL & SALARY PREVIEW */}
        {previewType === 'payroll' && (
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500">Employee Payslip Register • Nov 2026</span>
                <h4 className="font-bold text-slate-900 text-xs">Rohan Itankar (Software Engineer)</h4>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs">
                <HiOutlinePrinter className="w-3.5 h-3.5" />
                Download Slip PDF
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Earnings */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-emerald-700 text-[10px] uppercase block border-b border-emerald-100 pb-1">
                  Gross Earnings
                </span>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Basic Salary:</span>
                  <span className="font-mono font-bold">₹35,000</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">House Rent (HRA):</span>
                  <span className="font-mono font-bold">₹15,000</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Special Allowance:</span>
                  <span className="font-mono font-bold">₹10,000</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1 border-t border-slate-100 font-bold text-slate-900">
                  <span>Total Gross:</span>
                  <span className="text-emerald-700">₹60,000</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-rose-700 text-[10px] uppercase block border-b border-rose-100 pb-1">
                  Statutory &amp; Policy Deductions
                </span>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Provident Fund (12%):</span>
                  <span className="font-mono text-rose-600 font-bold">-₹4,200</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Professional Tax (PT):</span>
                  <span className="font-mono text-rose-600 font-bold">-₹200</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Late Penalty (1 mark):</span>
                  <span className="font-mono text-rose-600 font-bold">-₹250</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1 border-t border-slate-100 font-bold text-slate-900">
                  <span>Net In-Hand Pay:</span>
                  <span className="text-indigo-700 font-mono text-xs">₹55,350</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-center text-emerald-800 text-[10px] font-semibold">
              ✔ 26 Working Days • 25 Present • 1 Paid Leave • Computerized Verification Stamped
            </div>
          </div>
        )}

        {/* 5. REPORTS CENTER PREVIEW */}
        {previewType === 'reports' && (
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px]">
                  1. Attendance Report
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[10px]">
                  2. Salary &amp; Deductions
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[10px]">
                  3. Project &amp; Team Work
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1">
                  <HiOutlineArrowDownTray className="w-3 h-3" />
                  Excel CSV
                </button>
                <button className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-[10px] flex items-center gap-1">
                  <HiOutlinePrinter className="w-3 h-3" />
                  Print PDF
                </button>
              </div>
            </div>

            {/* Kisne kitna kaam kiya breakdown table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-bold text-[11px] text-slate-800 flex justify-between">
                <span>Team Contribution Breakdown ("Kisne Kitna Kaam Kiya")</span>
                <span className="text-indigo-600 text-[10px]">Project: ERP Redesign</span>
              </div>
              <div className="divide-y divide-slate-100 text-[10px]">
                <div className="p-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Dinesh Tawade (Backend Lead)</span>
                  <span className="font-mono text-indigo-700 font-bold">142h Logged (42.5% Share)</span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Rohan Itankar (Frontend Dev)</span>
                  <span className="font-mono text-indigo-700 font-bold">115h Logged (34.2% Share)</span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Mansi Sharma (UI/UX Designer)</span>
                  <span className="font-mono text-indigo-700 font-bold">78h Logged (23.3% Share)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. COLLABORATION (CHAT & VIDEO) */}
        {previewType === 'collaboration' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Channel list */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 hidden sm:block">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Channels</span>
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                  # general-hq (4 unread)
                </div>
                <div className="p-1.5 rounded-lg text-slate-600 font-medium text-[10px]">
                  # engineering-sprints
                </div>
                <div className="p-1.5 rounded-lg text-slate-600 font-medium text-[10px]">
                  # announcements-hr
                </div>
              </div>

              {/* Chat Window */}
              <div className="sm:col-span-2 bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between h-44">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      R
                    </div>
                    <div className="bg-slate-100 p-2 rounded-xl rounded-tl-none text-[10px]">
                      <span className="font-bold text-slate-800 block text-[9px]">Rohan Itankar</span>
                      Deployed new reports module with CSV export to staging!
                    </div>
                  </div>
                  <div className="flex items-start gap-2 justify-end">
                    <div className="bg-indigo-600 text-white p-2 rounded-xl rounded-tr-none text-[10px]">
                      Verified! Working clean. Starting team sync call now.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    disabled
                    placeholder="Type a message or share files..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px]"
                  />
                  <button className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg text-[10px] flex items-center gap-1">
                    <HiOutlineVideoCamera className="w-3.5 h-3.5" />
                    Start HD Call
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. CRM & CLIENT PORTAL */}
        {previewType === 'crm' && (
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-teal-600 font-bold uppercase">Client Guest Portal</span>
                <h4 className="font-bold text-slate-900 text-xs">Apex Global Logistics • Enterprise Account</h4>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                Project Progress: 84%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Current Milestone</span>
                <p className="font-bold text-slate-800 text-[11px] mt-0.5">Payment Gateway &amp; Invoicing</p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-teal-500 h-full w-[85%]" />
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Deliverables</span>
                <p className="font-bold text-slate-800 text-[11px] mt-0.5">18 Completed • 3 In Review</p>
                <span className="text-[9px] text-teal-600 font-semibold">100% on schedule</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Latest Invoice</span>
                <p className="font-bold text-slate-800 text-[11px] mt-0.5">INV-2026-089 (Paid)</p>
                <span className="text-[9px] text-indigo-600 underline font-semibold cursor-pointer">
                  Download GST Invoice
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ModuleShowcase = () => {
  const [activeModuleId, setActiveModuleId] = useState('dashboard');
  const activeModule = MODULES_DATA.find((m) => m.id === activeModuleId) || MODULES_DATA[0];

  return (
    <section id="modules" className="py-16 sm:py-24 lg:py-28 bg-slate-900 text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[200px] bg-violet-600/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="text-[10px] sm:text-xs font-mono-tech font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-3.5 py-1.5 rounded-full border border-indigo-800/80 inline-flex items-center gap-1.5">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            Interactive Software Showcase &amp; Tour
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-white tracking-tight mt-3">
            Every Enterprise Module Explained &amp; Visualized
          </h2>
          <p className="text-xs sm:text-base text-slate-400 mt-3 leading-relaxed max-w-2xl mx-auto">
            See exactly how each module looks and operates. Click any module below to inspect its features, live UI screens, and role workflows.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-3 mb-8 sm:mb-12 no-scrollbar">
          {MODULES_DATA.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.id === activeModuleId;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModuleId(mod.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-102'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                <span>{mod.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Module Visual Tour Box */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-4 sm:p-8 lg:p-10 backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Left Info Column */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono-tech font-bold bg-indigo-950/80 text-indigo-400 border border-indigo-800">
                <span>{activeModule.tag}</span>
              </div>

              <h3 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold text-white leading-tight">
                {activeModule.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activeModule.subtitle}
              </p>

              {/* "Kya Hai" Explanation Card */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 space-y-2">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                  Yeh Module Kya Hai &amp; Kaisa Kaam Karta Hai:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeModule.whatIsIt}
                </p>
              </div>

              {/* Key Capabilities Checklist */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-400">
                  Key Capabilities:
                </span>
                <ul className="space-y-2">
                  {activeModule.keyPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                      <HiOutlineCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Target Roles */}
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold text-slate-400">Roles Access:</span>
                {activeModule.roles.map((r, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-tech font-semibold bg-slate-700/80 text-slate-200 border border-slate-600"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Screen Mockup Column */}
            <div className="lg:col-span-7">
              <AppPreviewFrame previewType={activeModule.previewType} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModuleShowcase;
