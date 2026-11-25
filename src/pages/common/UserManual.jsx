import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineBookOpen,
  HiOutlineFingerPrint,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineCalendarDays,
  HiOutlineDocumentCheck,
  HiOutlineFolderArrowDown,
  HiOutlineBookmark,
  HiOutlineChatBubbleLeftRight,
  HiOutlineVideoCamera,
  HiOutlineLifebuoy,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineLightBulb,
  HiOutlineMagnifyingGlass,
  HiOutlinePrinter,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineSparkles,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineShieldCheck,
  HiOutlineComputerDesktop,
  HiOutlineQuestionMarkCircle,
} from 'react-icons/hi2';

const MANUAL_SECTIONS = [
  {
    id: 'attendance',
    title: 'Attendance & Geofenced Punch',
    shortTitle: 'Attendance',
    icon: HiOutlineFingerPrint,
    color: 'emerald',
    badge: 'Daily Essential',
    quickLink: '/punch-in',
    quickLinkLabel: 'Go to Punch In',
    summary: 'Everything you need to know about marking attendance, GPS geofencing, shift timings, and viewing your punch history.',
    steps: [
      {
        title: 'Geofenced Mobile & Desktop Punch In',
        desc: 'Log in to the portal and click "Punch In" in the top bar or sidebar. Ensure your browser is allowed GPS/Location access. The system instantly verifies your latitude/longitude against your branch perimeter.',
      },
      {
        title: 'Morning Shift & Grace Periods',
        desc: 'Standard shift starts at the designated office time with an allowed grace period (configured by HR). Punching in after the grace cutoff marks the day as "Late Arrival". Consecutive late days may reflect on monthly payroll deductions.',
      },
      {
        title: 'Punch Out at End of Shift',
        desc: 'Before leaving, click "Punch Out" from the dashboard or punch-in page. The system calculates your total active office hours automatically.',
      },
      {
        title: 'Checking Attendance Calendar & Status',
        desc: 'Navigate to "My Attendance" in the sidebar to review your monthly calendar with colored badges: Present (Green), Late (Amber), Half-Day (Orange), and Absent (Red).',
      },
    ],
    proTip: 'If your browser shows "Location Permission Denied", click the padlock icon in your browser URL bar, change Location to "Allow", and reload the page.',
  },
  {
    id: 'tasks',
    title: 'Daily Tasks & Live Stopwatch Timer',
    shortTitle: 'Tasks & Timer',
    icon: HiOutlineClipboardDocumentList,
    color: 'indigo',
    badge: 'Core Workflow',
    quickLink: '/admin/tasks',
    quickLinkLabel: 'Open Daily Tasks',
    summary: 'How to manage deliverables, start/pause live task stopwatches with reasons, track duration targets, and complete deliverables.',
    steps: [
      {
        title: 'Viewing Your Assigned Deliverables',
        desc: 'Go to "Daily Tasks" under Work & Projects. You can toggle between "My Tasks" (tasks assigned directly to you) and "All Tasks" across your team.',
      },
      {
        title: 'Self-Assignment vs Team Assignment',
        desc: 'Regular staff members can create and assign tasks to themselves. Only Team Leads and Administrators have permission to delegate tasks to other team members.',
      },
      {
        title: 'Live Task Stopwatch Timer',
        desc: 'When beginning work on a task, click the Green "Start" button in the task table or details drawer. The live timer counts up in real time, logging your exact working seconds.',
      },
      {
        title: 'Pausing with Mandatory Reason',
        desc: 'Need to step out, attend a meeting, or switch context? Click "Pause". Enter a brief note or reason (e.g. "Lunch Break", "Code Review Discussion") to keep timesheet logs accurate.',
      },
      {
        title: 'Completing Tasks & Timeline Targets',
        desc: 'Tasks display an estimated target duration (e.g., 4h or 3d). Once deliverables are ready, update status to "Completed" to finalize your logged timesheet.',
      },
    ],
    proTip: 'You can only have one active task stopwatch running at a time. Starting a new task timer will prompt you to pause or conclude your previous active session.',
  },
  {
    id: 'leaves',
    title: 'Leave Requests & Holiday Calendar',
    shortTitle: 'Leaves & Holidays',
    icon: HiOutlineCalendarDays,
    color: 'blue',
    badge: 'HR & Approvals',
    quickLink: '/my-leaves',
    quickLinkLabel: 'Manage My Leaves',
    summary: 'Apply for paid or unpaid time off, monitor approval statuses, and plan around official public holidays.',
    steps: [
      {
        title: 'Reviewing Remaining Leave Balance',
        desc: 'Navigate to "My Leaves & Apply". Top cards display your real-time quota for Casual Leaves (CL), Sick Leaves (SL), and Earned / Privilege Leaves (PL).',
      },
      {
        title: 'Submitting a Leave Application',
        desc: 'Click "+ Apply Leave". Select Leave Type, Start Date, End Date, and specify the reason. If applying for Half-Day, select the First Half or Second Half toggle.',
      },
      {
        title: 'Approval Hierarchy',
        desc: 'Your application is routed directly to your designated Team Head and HR Manager. You will receive an instant notification once approved or rejected.',
      },
      {
        title: 'Company Holiday Schedule',
        desc: 'Scroll down on the leaves page to view the list of official paid company holidays for the current calendar year.',
      },
    ],
    proTip: 'Apply for planned leaves at least 3-5 days in advance so project leads can balance sprint workloads.',
  },
  {
    id: 'salary',
    title: 'Monthly Salary Slips & Payslips',
    shortTitle: 'Salary Slips',
    icon: HiOutlineDocumentCheck,
    color: 'amber',
    badge: 'Finance & Slips',
    quickLink: '/my-salary-slips',
    quickLinkLabel: 'View My Salary Slips',
    summary: 'Access computerized monthly payslips, verify statutory tax deductions (EPF, ESI, PT), and download official PDFs.',
    steps: [
      {
        title: 'Viewing Payslip Archives',
        desc: 'Open "My Salary Slips" in the sidebar. All computerized payslips published by the HR and Finance department are listed month-by-month.',
      },
      {
        title: 'Earnings & Deductions Breakdown',
        desc: 'Each payslip itemizes: Basic Salary, HRA, Conveyance, Special Allowances, Overtime Pay, and statutory deductions including Provident Fund (EPF 12%), ESI (0.75%), Professional Tax (PT), and late deduction penalties.',
      },
      {
        title: '1-Click PDF Download & Print',
        desc: 'Click "Download PDF" or the Printer icon next to any month\'s statement to generate a clean, official company salary slip suitable for bank and tax filing purposes.',
      },
    ],
    proTip: 'Salary slips are generated by the 1st week of each month for the preceding month once attendance audits are locked.',
  },
  {
    id: 'documents',
    title: 'My Documents & KYC Vault',
    shortTitle: 'Documents & KYC',
    icon: HiOutlineFolderArrowDown,
    color: 'violet',
    badge: 'Security & Records',
    quickLink: '/my-documents',
    quickLinkLabel: 'Open Document Vault',
    summary: 'Securely upload identification proofs, academic credentials, and company contracts with AES-256 encrypted storage.',
    steps: [
      {
        title: 'Mandatory Compliance Documents',
        desc: 'Under "My Documents & KYC", ensure all required compliance documents are submitted: Aadhaar Card, PAN Card, Educational Degrees, Previous Experience Letters, and Bank Account Passbook/Cancelled Cheque.',
      },
      {
        title: 'Uploading Documents Safely',
        desc: 'Click "+ Upload Document". Select the document category, input the document ID number if applicable, attach the PDF or image (max 10MB), and submit.',
      },
      {
        title: 'Verification Status Badges',
        desc: 'Uploaded files are reviewed by the HR team. Your file badge will show "Pending Review", "Verified", or "Action Required" if a re-upload is needed.',
      },
    ],
    proTip: 'Always upload clear scanned copies or high-resolution photos in PDF or PNG format to avoid verification delays.',
  },
  {
    id: 'sticky-notes',
    title: 'Sticky Notes & Personal Reminders',
    shortTitle: 'Sticky Notes',
    icon: HiOutlineBookmark,
    color: 'rose',
    badge: 'Productivity Tool',
    quickLink: '/sticky-notes',
    quickLinkLabel: 'Open Sticky Notes',
    summary: 'Create fast scratchpad reminders, color-code ideas, and receive automated notifications before deadlines.',
    steps: [
      {
        title: 'Creating Quick Notes',
        desc: 'Go to "Sticky Notes & Reminders". Click "+ New Note" to jot down daily reminders, sprint action points, or customer numbers.',
      },
      {
        title: 'Color Tags & Priority',
        desc: 'Pick your preferred card theme (Indigo, Lemon Yellow, Emerald Green, Soft Coral, Sky Blue) to visually categorize your workspace.',
      },
      {
        title: 'Automated Reminder Push Notifications',
        desc: 'Optionally set a reminder date and time. The server\'s cron scheduler will dispatch an in-app notification when the reminder is due.',
      },
    ],
    proTip: 'Pin high-priority notes so they stay fixed to the top of your board even as you add new scratchpads.',
  },
  {
    id: 'collaboration',
    title: 'Team Chat & Video Meetings',
    shortTitle: 'Chat & Meetings',
    icon: HiOutlineChatBubbleLeftRight,
    color: 'sky',
    badge: 'Communication',
    quickLink: '/admin/chat',
    quickLinkLabel: 'Open Team Chat',
    summary: 'Coordinate in real-time through direct messages, department channels, and one-click WebRTC team video meetings.',
    steps: [
      {
        title: 'Direct Messages & Department Channels',
        desc: 'Click "Team Chat" in the sidebar to talk with any colleague or post announcements in public channels with real-time online presence indicators.',
      },
      {
        title: 'Starting or Joining Video Meetings',
        desc: 'Navigate to "Team Meeting" or open a meeting invite link. Enable your camera and microphone to collaborate in an encrypted, peer-to-peer WebRTC video room.',
      },
      {
        title: 'Screen Sharing & Whiteboard',
        desc: 'During any team meeting, click the screen share button to present presentations, Figma designs, or code reviews directly to your peers.',
      },
    ],
    proTip: 'Keep your browser microphone permission enabled so you can join impromptu standups without technical delays.',
  },
  {
    id: 'support',
    title: 'Help Desk & Support Tickets',
    shortTitle: 'Help Desk',
    icon: HiOutlineLifebuoy,
    color: 'amber',
    badge: 'Assistance',
    quickLink: '/company-support',
    quickLinkLabel: 'Raise Support Ticket',
    summary: 'Get fast resolution for IT hardware issues, payroll discrepancies, HR queries, or software bugs.',
    steps: [
      {
        title: 'Company Support vs Software Support',
        desc: 'Use "Company Support" for internal inquiries (HR policies, attendance fixes, payroll adjustments, asset requests). Use "Software Support" to report ERP platform glitches.',
      },
      {
        title: 'Submitting a Ticket',
        desc: 'Click "Create Ticket", select the category, choose priority (Normal, Medium, Urgent), describe the issue in detail, and attach relevant screenshots.',
      },
      {
        title: 'Tracking Ticket Resolution',
        desc: 'You will receive status updates as administrators or HR assign and resolve your ticket.',
      },
    ],
    proTip: 'Attaching a clear screenshot of any error dramatically speeds up IT and HR resolution times.',
  },
];

const FAQS = [
  {
    q: 'Why does Punch In say "You are outside the office geofence"?',
    a: 'Your company branch requires employees to punch in within a specific GPS radius (typically 100m to 500m of the office building). Make sure you have connected to office Wi-Fi, enabled high-accuracy GPS on your mobile device, and allowed browser location access.',
  },
  {
    q: 'Can I assign a task to another team member?',
    a: 'To maintain clean organizational hierarchy, standard staff users can assign tasks to themselves. Only Team Leads and Administrators have permission to assign tasks to other colleagues.',
  },
  {
    q: 'How is late deduction calculated in payroll?',
    a: 'If you punch in past the company\'s configured grace period (e.g. 15 minutes after shift start time), the attendance engine marks the day as "Late". Under standard attendance rules, reaching a threshold of late arrivals (e.g., 3 late days in a month) may deduct half a day\'s wage automatically.',
  },
  {
    q: 'What should I do if I forget to punch out at the end of the day?',
    a: 'Raise a ticket under "Company Support" or contact your HR Manager directly. HR can audit your logged task time sessions and regularize your punch-out timestamp.',
  },
  {
    q: 'Are my uploaded documents safe and private?',
    a: 'Yes. All employee KYC documents and files are stored in an encrypted vault accessible strictly by you and authorized HR / Administrative personnel with explicit document viewing permissions.',
  },
  {
    q: 'Can I use the portal on my mobile phone?',
    a: 'Yes! The entire application is fully responsive. You can open the portal in mobile Chrome or Safari, mark geofenced punches, manage daily tasks, and download salary slips on the go.',
  },
];

const UserManual = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Filter sections by search query or category
  const filteredSections = useMemo(() => {
    let list = MANUAL_SECTIONS;
    if (activeTab !== 'all') {
      list = list.filter((s) => s.id === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q) ||
          s.steps.some((st) => st.title.toLowerCase().includes(q) || st.desc.toLowerCase().includes(q))
      );
    }
    return list;
  }, [searchQuery, activeTab]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12 selection:bg-indigo-500/20">
      {/* ===================== 1. HERO & SEARCH HEADER ===================== */}
      <div className="relative rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-10 shadow-xl overflow-hidden border border-indigo-800/60">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
              <HiOutlineBookOpen className="w-4 h-4 text-indigo-300" />
              <span>Standard Operating Procedures</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Employee User Manual &amp; Operations Guide
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Step-by-step operating guidelines for daily attendance, live task stopwatches, leave requests, computerized payslips, and team collaboration.
            </p>
          </div>

          {/* Print & Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-semibold transition-all backdrop-blur-sm cursor-pointer shadow-sm hover:scale-[1.02]"
              title="Print or Save as PDF"
            >
              <HiOutlinePrinter className="w-4 h-4 text-slate-200" />
              <span>Print Guide</span>
            </button>
            <Link
              to="/punch-in"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer hover:scale-[1.02]"
            >
              <HiOutlineFingerPrint className="w-4 h-4" />
              <span>Quick Punch In</span>
            </Link>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="mt-8 relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <HiOutlineMagnifyingGlass className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides (e.g., 'punch in', 'stopwatch', 'salary slip', 'late deduction')..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ===================== 2. QUICK CATEGORY PILLS ===================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Topics ({MANUAL_SECTIONS.length})
        </button>
        {MANUAL_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isCurrent = activeTab === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveTab(sec.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
                isCurrent
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{sec.shortTitle}</span>
            </button>
          );
        })}
      </div>

      {/* ===================== 3. FIRST-DAY ONBOARDING CHECKLIST ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
              <HiOutlineSparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Daily Workflow Routine (Quick 4-Step Checklist)
              </h2>
              <p className="text-xs text-slate-500">Standard checklist to follow every working day</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Recommended Daily Habit
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-colors">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>1. Morning Punch In</span>
              <span className="text-[10px] text-emerald-600 font-mono">09:00 AM</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-2">
              Mark attendance using geofenced browser location within the office perimeter.
            </p>
            <Link to="/punch-in" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <span>Punch In Now</span>
              <HiOutlineChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-colors">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>2. Start Task Stopwatch</span>
              <span className="text-[10px] text-indigo-600 font-mono">Real-Time</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-2">
              Pick your active task from Daily Tasks and click Start. Pause with a note when taking breaks.
            </p>
            <Link to="/admin/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <span>Open Daily Tasks</span>
              <HiOutlineChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-colors">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>3. Check Reminders</span>
              <span className="text-[10px] text-amber-600 font-mono">Reminders</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-2">
              Review personal Sticky Notes and collaborate on group channels in Team Chat.
            </p>
            <Link to="/sticky-notes" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <span>View Sticky Notes</span>
              <HiOutlineChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-colors">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>4. Evening Punch Out</span>
              <span className="text-[10px] text-rose-600 font-mono">06:00 PM</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-2">
              Conclude your active task session and record your final evening punch out.
            </p>
            <Link to="/punch-in" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <span>End Day Punch Out</span>
              <HiOutlineChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ===================== 4. STEP-BY-STEP MODULE GUIDES ===================== */}
      <div className="space-y-6">
        {filteredSections.map((sec, idx) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.id}
              id={sec.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all hover:shadow-md"
            >
              {/* Card Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-400 font-bold">0{idx + 1}.</span>
                      <h3 className="text-base sm:text-xl font-bold text-slate-900">{sec.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {sec.badge}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-3xl">
                      {sec.summary}
                    </p>
                  </div>
                </div>

                <Link
                  to={sec.quickLink}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <span>{sec.quickLinkLabel}</span>
                  <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Step By Step List */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sec.steps.map((st, stepIdx) => (
                    <div
                      key={stepIdx}
                      className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                        {stepIdx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {st.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {st.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pro Tip Callout */}
                {sec.proTip && (
                  <div className="mt-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5">
                    <HiOutlineLightBulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed">
                      <strong className="font-bold">Pro Tip: </strong>
                      {sec.proTip}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredSections.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <HiOutlineQuestionMarkCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm sm:text-base font-bold text-slate-700">No matching guides found</h3>
            <p className="text-xs text-slate-500 mt-1">Try searching for keywords like "punch", "leave", "timer", or "password".</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Reset Search Filter
            </button>
          </div>
        )}
      </div>

      {/* ===================== 5. FREQUENTLY ASKED QUESTIONS (FAQ) ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
            <HiOutlineQuestionMarkCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900">
              Frequently Asked Questions &amp; Troubleshooting
            </h2>
            <p className="text-xs text-slate-500">Quick answers to common staff and employee questions</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {FAQS.map((faq, fIdx) => {
            const isExpanded = expandedFaq === fIdx;
            return (
              <div key={fIdx} className="py-3.5 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : fIdx)}
                  className="w-full flex items-center justify-between text-left gap-3 text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-indigo-600 font-mono">Q{fIdx + 1}.</span>
                    <span>{faq.q}</span>
                  </span>
                  <HiOutlineChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`}
                  />
                </button>
                {isExpanded && (
                  <p className="text-xs text-slate-600 leading-relaxed mt-2 pl-6 animate-in fade-in duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================== 6. NEED FURTHER ASSISTANCE? ===================== */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0">
            <HiOutlineLifebuoy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Still have questions or facing an issue?</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Submit an internal support ticket to reach your company HR or IT administrator directly.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Link
            to="/company-support"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold text-center transition-colors shadow-sm"
          >
            Create Support Ticket
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserManual;
