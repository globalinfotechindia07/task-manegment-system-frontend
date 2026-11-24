import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentArrowDown,
  HiOutlineCalendarDays,
  HiOutlineBanknotes,
  HiOutlineFolder,
  HiOutlineFunnel,
  HiOutlineArrowDownTray,
  HiOutlinePrinter,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiOutlineBuildingOffice2,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

/* ============================================================
   DESIGN TOKENS
   ============================================================ */
const tokens = {
  card: 'bg-white border border-slate-200 rounded-xl shadow-xs',
  label: 'block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5',
  input:
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors',
  btnPrimary:
    'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs text-xs px-3.5 py-2 transition-all cursor-pointer',
  btnSuccess:
    'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs text-xs px-3.5 py-2 transition-all cursor-pointer',
  btnSecondary:
    'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-xs text-xs px-3.5 py-2 transition-all cursor-pointer',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/* Helper to trigger CSV download */
const downloadCSV = (filename, headers, rows) => {
  const escapeCell = (cell) => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((r) => r.map(escapeCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success(`Exported ${filename}.csv`);
};

/* Helper for Printable PDF */
const printReportWindow = ({ title, subtitle, company, kpis = [], columns = [], rows = [], footerNote = '' }) => {
  const printWin = window.open('', '_blank');
  if (!printWin) {
    toast.error('Pop-up blocked. Please allow popups for this site to print PDF.');
    return;
  }

  const companyName = company?.name || 'Company Management System';
  const companyCode = company?.companyCode ? `Code: ${company.companyCode}` : '';
  const dateGenerated = new Date().toLocaleString('en-IN');

  const kpiHtml = kpis.length > 0 ? `
    <div style="display: grid; grid-template-columns: repeat(${Math.min(4, kpis.length)}, 1fr); gap: 12px; margin: 18px 0;">
      ${kpis.map((k) => `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
          <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${k.label}</div>
          <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">${k.value}</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const tableHead = `
    <thead>
      <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
        ${columns.map((c) => `<th style="padding: 9px 12px; text-align: left; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #475569;">${c}</th>`).join('')}
      </tr>
    </thead>
  `;

  const tableBody = `
    <tbody>
      ${rows.map((r, i) => `
        <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
          ${r.map((val) => `<td style="padding: 8px 12px; font-size: 11px; color: #334155;">${val !== undefined && val !== null ? val : '—'}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${companyName}</title>
        <style>
          @page { size: A4 landscape; margin: 14mm 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 16px; color: #0f172a; font-size: 12px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 12px; }
          .title { font-size: 20px; font-weight: 800; color: #1e1b4b; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
          .meta { text-align: right; font-size: 11px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; }
          .sig-box { width: 200px; border-top: 1px dashed #94a3b8; text-align: center; font-size: 11px; color: #64748b; padding-top: 6px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${title}</div>
            <div class="subtitle">${subtitle} • ${companyName} (${companyCode})</div>
          </div>
          <div class="meta">
            <div><strong>Generated:</strong> ${dateGenerated}</div>
            <div><strong>Confidentiality:</strong> Company Internal Record</div>
          </div>
        </div>

        ${kpiHtml}

        <table>
          ${tableHead}
          ${tableBody}
        </table>

        ${footerNote ? `<div style="margin-top: 14px; font-size: 11px; color: #64748b; font-style: italic;">* ${footerNote}</div>` : ''}

        <div class="signatures">
          <div class="sig-box">Prepared By</div>
          <div class="sig-box">Verified / HR Dept</div>
          <div class="sig-box">Authorized Signatory / Admin</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
};

const ReportsCenter = () => {
  const { user } = useAuth();
  const currentDate = new Date();

  // Active Report Tab: 'attendance' | 'salary' | 'projects'
  const [activeTab, setActiveTab] = useState('attendance');

  // Attendance Filters
  const [attMonth, setAttMonth] = useState(currentDate.getMonth() + 1);
  const [attYear, setAttYear] = useState(currentDate.getFullYear());
  const [attEmployeeId, setAttEmployeeId] = useState('All');
  const [attDepartment, setAttDepartment] = useState('All');

  // Salary Filters
  const [salMonth, setSalMonth] = useState(currentDate.getMonth() + 1);
  const [salYear, setSalYear] = useState(currentDate.getFullYear());
  const [salEmployeeId, setSalEmployeeId] = useState('All');

  // Project Filters
  const [projId, setProjId] = useState('All');

  // Fetch Users & Projects for filter dropdowns
  const { data: usersList = [] } = useQuery({
    queryKey: ['reportsCenterUsers'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: projectsList = [] } = useQuery({
    queryKey: ['reportsCenterProjects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return Array.isArray(data) ? data : [];
    },
  });

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set();
    usersList.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [usersList]);

  // 1. ATTENDANCE REPORT QUERY
  const {
    data: attendanceReportData,
    isLoading: attLoading,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ['reportExportAttendance', attMonth, attYear, attEmployeeId, attDepartment],
    queryFn: async () => {
      const { data } = await api.get('/reports-center/attendance', {
        params: {
          month: attMonth,
          year: attYear,
          employeeId: attEmployeeId,
          department: attDepartment,
        },
      });
      return data;
    },
    enabled: activeTab === 'attendance',
  });

  // 2. SALARY REPORT QUERY
  const {
    data: salaryReportData,
    isLoading: salLoading,
    refetch: refetchSalary,
  } = useQuery({
    queryKey: ['reportExportSalary', salMonth, salYear, salEmployeeId],
    queryFn: async () => {
      const { data } = await api.get('/reports-center/salary', {
        params: {
          month: salMonth,
          year: salYear,
          employeeId: salEmployeeId,
        },
      });
      return data;
    },
    enabled: activeTab === 'salary',
  });

  // 3. PROJECT REPORT QUERY
  const {
    data: projectReportData,
    isLoading: projLoading,
    refetch: refetchProject,
  } = useQuery({
    queryKey: ['reportExportProjects', projId],
    queryFn: async () => {
      const { data } = await api.get('/reports-center/projects', {
        params: {
          projectId: projId,
        },
      });
      return data;
    },
    enabled: activeTab === 'projects',
  });

  // ==========================================
  // EXPORT HANDLERS
  // ==========================================

  // --- Attendance Export ---
  const handleExportAttendanceCSV = () => {
    if (!attendanceReportData) return;
    const periodStr = `${MONTH_NAMES[attMonth - 1]}_${attYear}`;

    if (attendanceReportData.reportType === 'individual_attendance') {
      const empName = attendanceReportData.employee?.name || 'Employee';
      const filename = `Attendance_${empName.replace(/\s+/g, '_')}_${periodStr}`;
      const headers = ['Date', 'Day', 'Status', 'Punch In', 'Punch Out', 'Work Duration', 'Late (Mins)', 'Remarks'];
      const rows = (attendanceReportData.dailyRecords || []).map((r) => [
        r.date,
        r.day,
        r.status,
        r.punchIn,
        r.punchOut,
        r.workDuration,
        r.lateByMinutes,
        r.remarks || (r.isManuallyEdited ? 'Manually Edited' : ''),
      ]);
      downloadCSV(filename, headers, rows);
    } else {
      const filename = `Company_Attendance_Summary_${periodStr}`;
      const headers = ['Employee Name', 'Email', 'Designation', 'Department', 'Working Days', 'Present', 'Late Marks', 'Half Days', 'Absent', 'Leaves', 'Total Hours', 'Attendance Rate'];
      const rows = (attendanceReportData.employees || []).map((e) => [
        e.name,
        e.email,
        e.designation,
        e.department,
        e.totalWorkingDays,
        e.presentDays,
        e.lateDays,
        e.halfDays,
        e.absentDays,
        e.leaveDays,
        e.totalHoursFormatted,
        `${e.attendanceRate}%`,
      ]);
      downloadCSV(filename, headers, rows);
    }
  };

  const handlePrintAttendancePDF = () => {
    if (!attendanceReportData) return;
    const periodStr = `${MONTH_NAMES[attMonth - 1]} ${attYear}`;
    const company = attendanceReportData.company;

    if (attendanceReportData.reportType === 'individual_attendance') {
      const emp = attendanceReportData.employee;
      const s = attendanceReportData.summary || {};
      const title = `Monthly Attendance Log - ${emp.name}`;
      const subtitle = `Period: ${periodStr} | Designation: ${emp.designation || 'Staff'} | Dept: ${emp.department || 'General'}`;
      const kpis = [
        { label: 'Working Days', value: s.workingDays },
        { label: 'Present Days', value: `${s.presentDays} days` },
        { label: 'Late Marks', value: `${s.lateDays} (Total ${s.totalLateMinutes}m)` },
        { label: 'Attendance %', value: `${s.attendancePercentage}%` },
      ];
      const columns = ['Date', 'Day', 'Status', 'Punch In', 'Punch Out', 'Duration', 'Late (Mins)', 'Remarks'];
      const rows = (attendanceReportData.dailyRecords || []).map((r) => [
        r.date,
        r.day,
        r.status,
        r.punchIn,
        r.punchOut,
        r.workDuration,
        r.lateByMinutes > 0 ? `${r.lateByMinutes}m` : '—',
        r.remarks || (r.isManuallyEdited ? 'Edited' : '—'),
      ]);
      printReportWindow({ title, subtitle, company, kpis, columns, rows, footerNote: 'Total productive hours tracked: ' + s.totalWorkingHoursFormatted });
    } else {
      const s = attendanceReportData.summary || {};
      const title = `Company Staff Attendance Register`;
      const subtitle = `Period: ${periodStr} | Total Staff: ${s.totalStaff} | Overall Attendance: ${s.overallAttendanceRate}%`;
      const kpis = [
        { label: 'Total Employees', value: s.totalStaff },
        { label: 'Expected Days', value: `${s.expectedWorkingDays} days` },
        { label: 'Total Late Marks', value: s.totalLateMarks },
        { label: 'Avg Attendance', value: `${s.overallAttendanceRate}%` },
      ];
      const columns = ['Employee Name', 'Department', 'Working Days', 'Present', 'Late Marks', 'Half Days', 'Absent', 'Leaves', 'Total Hours', 'Rate'];
      const rows = (attendanceReportData.employees || []).map((e) => [
        e.name,
        e.department,
        e.totalWorkingDays,
        e.presentDays,
        e.lateDays,
        e.halfDays,
        e.absentDays,
        e.leaveDays,
        e.totalHoursFormatted,
        `${e.attendanceRate}%`,
      ]);
      printReportWindow({ title, subtitle, company, kpis, columns, rows });
    }
  };

  // --- Salary Export ---
  const handleExportSalaryCSV = () => {
    if (!salaryReportData) return;
    const periodStr = `${MONTH_NAMES[salMonth - 1]}_${salYear}`;
    const filename = `Payroll_Salary_Report_${periodStr}`;
    const headers = [
      'Employee Name', 'Email', 'Designation', 'Department',
      'Working Days', 'Present Days', 'Late Days',
      'Gross Salary (₹)', 'Late Deduction (₹)', 'PF (₹)', 'ESIC (₹)', 'PT (₹)',
      'Total Deductions (₹)', 'Net In-Hand Pay (₹)', 'Payment Status', 'Payment Mode'
    ];
    const rows = (salaryReportData.salaries || []).map((s) => [
      s.employeeName,
      s.email,
      s.designation,
      s.department,
      s.workingDays,
      s.presentDays,
      s.lateDays,
      s.grossEarnings,
      s.lateDeduction,
      s.pfDeduction,
      s.esicDeduction,
      s.ptDeduction,
      s.totalDeductions,
      s.netPay,
      s.status,
      s.paymentMode,
    ]);
    downloadCSV(filename, headers, rows);
  };

  const handlePrintSalaryPDF = () => {
    if (!salaryReportData) return;
    const periodStr = `${MONTH_NAMES[salMonth - 1]} ${salYear}`;
    const s = salaryReportData.summary || {};
    const title = `Monthly Payroll & Salary Disbursement Sheet`;
    const subtitle = `Period: ${periodStr} | Total Staff: ${s.totalEmployees} | Disbursed: ₹${s.totalNetDisbursed?.toLocaleString('en-IN')}`;
    const kpis = [
      { label: 'Gross Payroll', value: `₹${(s.totalGrossPayroll || 0).toLocaleString('en-IN')}` },
      { label: 'Late Deductions', value: `₹${(s.totalLateDeductions || 0).toLocaleString('en-IN')}` },
      { label: 'Total Deductions', value: `₹${(s.totalDeductions || 0).toLocaleString('en-IN')}` },
      { label: 'Net Payable', value: `₹${(s.totalNetDisbursed || 0).toLocaleString('en-IN')}` },
    ];
    const columns = ['Employee Name', 'Designation', 'Days (P/L)', 'Gross (₹)', 'Late Ded (₹)', 'PF/ESIC/PT (₹)', 'Total Ded (₹)', 'Net Pay (₹)', 'Status'];
    const rows = (salaryReportData.salaries || []).map((emp) => [
      emp.employeeName,
      emp.designation,
      `${emp.presentDays}P / ${emp.lateDays}L`,
      `₹${emp.grossEarnings?.toLocaleString('en-IN')}`,
      emp.lateDeduction > 0 ? `₹${emp.lateDeduction?.toLocaleString('en-IN')}` : '₹0',
      `₹${(emp.pfDeduction + emp.esicDeduction + emp.ptDeduction)?.toLocaleString('en-IN')}`,
      `₹${emp.totalDeductions?.toLocaleString('en-IN')}`,
      `₹${emp.netPay?.toLocaleString('en-IN')}`,
      emp.status,
    ]);
    printReportWindow({
      title,
      subtitle,
      company: salaryReportData.company,
      kpis,
      columns,
      rows,
      footerNote: 'All statutory contributions and late mark deductions are computed per office policies.',
    });
  };

  // --- Project Export ---
  const handleExportProjectCSV = () => {
    if (!projectReportData) return;

    if (projectReportData.reportType === 'single_project') {
      const pName = (projectReportData.project?.name || 'Project').replace(/\s+/g, '_');
      const filename = `Project_Work_Report_${pName}`;
      const headers = ['Team Member', 'Designation', 'Total Tasks', 'Completed Tasks', 'Productive Time', 'Contribution %'];
      const rows = (projectReportData.teamBreakdown || []).map((m) => [
        m.name,
        m.designation,
        m.totalTasks,
        m.completedTasks,
        m.productiveHoursFormatted,
        `${m.workContributionPercentage}%`,
      ]);
      downloadCSV(filename, headers, rows);
    } else {
      const filename = `All_Projects_Summary_Report`;
      const headers = ['Project Name', 'Status', 'Start Date', 'End Date', 'Total Tasks', 'Completed', 'Progress %', 'Total Logged Hours'];
      const rows = (projectReportData.projects || []).map((p) => [
        p.name,
        p.status,
        p.startDate,
        p.endDate,
        p.totalTasks,
        p.completedTasks,
        `${p.completionRate}%`,
        p.loggedHoursFormatted,
      ]);
      downloadCSV(filename, headers, rows);
    }
  };

  const handlePrintProjectPDF = () => {
    if (!projectReportData) return;

    if (projectReportData.reportType === 'single_project') {
      const p = projectReportData.project;
      const s = projectReportData.summary || {};
      const title = `Project Work & Contribution Report: ${p.name}`;
      const subtitle = `Client: ${p.clientName} | Status: ${p.status} | Total Hours: ${s.totalLoggedHoursFormatted}`;
      const kpis = [
        { label: 'Total Tasks', value: s.totalTasks },
        { label: 'Completed', value: `${s.completedTasks} (${s.completionRate}%)` },
        { label: 'Logged Work', value: s.totalLoggedHoursFormatted },
        { label: 'Top Contributor', value: s.topContributor },
      ];
      const columns = ['Team Member', 'Designation', 'Assigned Tasks', 'Completed', 'Productive Hours', 'Work Contribution %'];
      const rows = (projectReportData.teamBreakdown || []).map((m) => [
        m.name,
        m.designation,
        m.totalTasks,
        m.completedTasks,
        m.productiveHoursFormatted,
        `${m.workContributionPercentage}%`,
      ]);
      printReportWindow({
        title,
        subtitle,
        company: projectReportData.company,
        kpis,
        columns,
        rows,
        footerNote: 'Work contribution percentages are auto-calculated from active stopwatch and timeline tracking sessions.',
      });
    } else {
      const s = projectReportData.summary || {};
      const title = `Enterprise Projects Overview & Time Logs`;
      const subtitle = `Total Projects: ${s.totalProjects} | Active: ${s.activeProjects} | Total Hours: ${s.totalLoggedHoursFormatted}`;
      const kpis = [
        { label: 'Total Projects', value: s.totalProjects },
        { label: 'Active Projects', value: s.activeProjects },
        { label: 'Tasks Completed', value: `${s.totalCompletedTasks} / ${s.totalTasks}` },
        { label: 'Total Logged Time', value: s.totalLoggedHoursFormatted },
      ];
      const columns = ['Project Name', 'Status', 'Start Date', 'End Date', 'Tasks (Total/Done)', 'Progress %', 'Total Tracked Time'];
      const rows = (projectReportData.projects || []).map((p) => [
        p.name,
        p.status,
        p.startDate,
        p.endDate,
        `${p.totalTasks} / ${p.completedTasks}`,
        `${p.completionRate}%`,
        p.loggedHoursFormatted,
      ]);
      printReportWindow({ title, subtitle, company: projectReportData.company, kpis, columns, rows });
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-2 backdrop-blur-xs">
              <HiOutlineDocumentArrowDown className="w-4 h-4 text-indigo-300" />
              <span>Enterprise Export &amp; Reporting Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Reports &amp; Download Center
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 mt-1 max-w-2xl leading-relaxed">
              Generate, filter, and export customized Attendance, Salary/Payroll, and Project Team Work reports in Excel (.csv) and formatted PDF formats.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-indigo-200 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
              Office: {user?.company?.name || 'HQ Office'}
            </span>
          </div>
        </div>

        {/* Primary Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-indigo-700/50 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-white text-indigo-950 shadow-sm'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <HiOutlineCalendarDays className="w-4 h-4" />
            <span>Attendance Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('salary')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'salary'
                ? 'bg-white text-indigo-950 shadow-sm'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <HiOutlineBanknotes className="w-4 h-4" />
            <span>Salary &amp; Deductions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-white text-indigo-950 shadow-sm'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <HiOutlineFolder className="w-4 h-4" />
            <span>Project &amp; Team Work</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          TAB 1: ATTENDANCE REPORT
          ============================================================ */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className={`${tokens.card} p-4`}>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                <div>
                  <label className={tokens.label}>Select Month</label>
                  <select
                    value={attMonth}
                    onChange={(e) => setAttMonth(Number(e.target.value))}
                    className={tokens.input}
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={tokens.label}>Select Year</label>
                  <select
                    value={attYear}
                    onChange={(e) => setAttYear(Number(e.target.value))}
                    className={tokens.input}
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={tokens.label}>Employee Filter</label>
                  <select
                    value={attEmployeeId}
                    onChange={(e) => setAttEmployeeId(e.target.value)}
                    className={tokens.input}
                  >
                    <option value="All">All Employees (Company Register)</option>
                    {usersList.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.designation || u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={tokens.label}>Department</label>
                  <select
                    value={attDepartment}
                    onChange={(e) => setAttDepartment(e.target.value)}
                    disabled={attEmployeeId !== 'All'}
                    className={`${tokens.input} disabled:opacity-50`}
                  >
                    <option value="All">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportAttendanceCSV}
                  disabled={attLoading || !attendanceReportData}
                  className={tokens.btnSuccess}
                  title="Download Attendance as CSV / Excel"
                >
                  <HiOutlineArrowDownTray className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintAttendancePDF}
                  disabled={attLoading || !attendanceReportData}
                  className={tokens.btnPrimary}
                  title="Print or Save as Formatted PDF"
                >
                  <HiOutlinePrinter className="w-4 h-4 stroke-[2.5]" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Loading */}
          {attLoading ? (
            <div className={`${tokens.card} p-12 text-center`}>
              <div className="inline-block w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium mt-3">Compiling monthly attendance records…</p>
            </div>
          ) : attendanceReportData ? (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {attendanceReportData.reportType === 'individual_attendance' ? (
                  <>
                    <div className={`${tokens.card} p-4 border-l-4 border-l-indigo-600`}>
                      <span className={tokens.label}>Expected Working Days</span>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                        {attendanceReportData.summary?.workingDays} Days
                      </div>
                      <span className="text-[10px] text-slate-400">Total in {MONTH_NAMES[attMonth - 1]}</span>
                    </div>

                    <div className={`${tokens.card} p-4 border-l-4 border-l-emerald-500`}>
                      <span className={tokens.label}>Present / On Time</span>
                      <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
                        {attendanceReportData.summary?.presentDays} Days
                      </div>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        Attendance: {attendanceReportData.summary?.attendancePercentage}%
                      </span>
                    </div>

                    <div className={`${tokens.card} p-4 border-l-4 border-l-amber-500`}>
                      <span className={tokens.label}>Late Marks &amp; Hours</span>
                      <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">
                        {attendanceReportData.summary?.lateDays} Late
                      </div>
                      <span className="text-[10px] text-amber-700 font-medium">
                        Total {attendanceReportData.summary?.totalLateMinutes} mins late
                      </span>
                    </div>

                    <div className={`${tokens.card} p-4 border-l-4 border-l-rose-500`}>
                      <span className={tokens.label}>Absents &amp; Half Days</span>
                      <div className="text-xl sm:text-2xl font-black text-rose-600 mt-0.5">
                        {attendanceReportData.summary?.absentDays} Absent
                      </div>
                      <span className="text-[10px] text-rose-500 font-medium">
                        {attendanceReportData.summary?.halfDays} Half Day(s)
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`${tokens.card} p-4 border-l-4 border-l-indigo-600`}>
                      <span className={tokens.label}>Total Active Staff</span>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                        {attendanceReportData.summary?.totalStaff} Employees
                      </div>
                      <span className="text-[10px] text-slate-400">Company Office Scope</span>
                    </div>

                    <div className={`${tokens.card} p-4 border-l-4 border-l-emerald-500`}>
                      <span className={tokens.label}>Avg Attendance Rate</span>
                      <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
                        {attendanceReportData.summary?.overallAttendanceRate}%
                      </div>
                      <span className="text-[10px] text-emerald-600 font-medium">Company-wide Average</span>
                    </div>

                    <div className={`${tokens.card} p-4 border-l-4 border-l-amber-500`}>
                      <span className={tokens.label}>Total Late Marks</span>
                      <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">
                        {attendanceReportData.summary?.totalLateMarks} Marks
                      </div>
                      <span className="text-[10px] text-amber-700 font-medium">Across all team members</span>
                    </div>

                    <div className={`${tokens.card} p-4 border-l-4 border-l-indigo-500`}>
                      <span className={tokens.label}>Total Productive Hours</span>
                      <div className="text-xl sm:text-2xl font-black text-indigo-700 mt-0.5">
                        {attendanceReportData.summary?.totalCompanyHours} hrs
                      </div>
                      <span className="text-[10px] text-indigo-600 font-medium">Total Punch Working Time</span>
                    </div>
                  </>
                )}
              </div>

              {/* Data Table */}
              <div className={`${tokens.card} overflow-hidden`}>
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {attendanceReportData.reportType === 'individual_attendance'
                      ? `Day-by-Day Punch Logs for ${attendanceReportData.employee?.name}`
                      : 'Monthly Staff Attendance Register'}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    {attendanceReportData.period}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  {attendanceReportData.reportType === 'individual_attendance' ? (
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-3 py-3">Day</th>
                          <th className="px-3 py-3">Status</th>
                          <th className="px-3 py-3">Punch In</th>
                          <th className="px-3 py-3">Punch Out</th>
                          <th className="px-3 py-3">Work Duration</th>
                          <th className="px-3 py-3">Late Duration</th>
                          <th className="px-4 py-3">Remarks / Edits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceReportData.dailyRecords?.map((r) => (
                          <tr key={r.date} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-2.5 font-mono font-medium text-slate-900">{r.date}</td>
                            <td className="px-3 py-2.5 font-medium text-slate-600">{r.day}</td>
                            <td className="px-3 py-2.5">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  r.status === 'Present'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : r.status === 'Late'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : r.status === 'Half Day'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : r.status === 'Weekend'
                                    ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                    : r.status === 'On Leave'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-slate-700">{r.punchIn}</td>
                            <td className="px-3 py-2.5 font-mono text-slate-700">{r.punchOut}</td>
                            <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{r.workDuration}</td>
                            <td className="px-3 py-2.5 font-mono text-amber-600 font-semibold">
                              {r.lateByMinutes > 0 ? `${r.lateByMinutes}m` : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 text-[11px] italic">
                              {r.remarks || (r.isManuallyEdited ? 'Manually Edited' : '—')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Employee</th>
                          <th className="px-3 py-3">Department</th>
                          <th className="px-3 py-3">Working Days</th>
                          <th className="px-3 py-3 text-emerald-700">Present</th>
                          <th className="px-3 py-3 text-amber-700">Late Marks</th>
                          <th className="px-3 py-3 text-blue-700">Half Days</th>
                          <th className="px-3 py-3 text-rose-700">Absent</th>
                          <th className="px-3 py-3">Leaves</th>
                          <th className="px-3 py-3">Total Hours</th>
                          <th className="px-4 py-3 text-right">Attendance Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceReportData.employees?.map((emp) => (
                          <tr key={emp._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-2.5">
                              <span className="font-bold text-slate-900 block">{emp.name}</span>
                              <span className="text-[10px] text-slate-400">{emp.designation}</span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-600 font-medium">{emp.department}</td>
                            <td className="px-3 py-2.5 font-mono">{emp.totalWorkingDays}</td>
                            <td className="px-3 py-2.5 font-mono font-bold text-emerald-700">{emp.presentDays}</td>
                            <td className="px-3 py-2.5 font-mono font-bold text-amber-700">{emp.lateDays}</td>
                            <td className="px-3 py-2.5 font-mono text-blue-700">{emp.halfDays}</td>
                            <td className="px-3 py-2.5 font-mono text-rose-700 font-bold">{emp.absentDays}</td>
                            <td className="px-3 py-2.5 font-mono text-purple-700">{emp.leaveDays}</td>
                            <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{emp.totalHoursFormatted}</td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-indigo-700">
                              {emp.attendanceRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ============================================================
          TAB 2: SALARY & PAYROLL REPORT
          ============================================================ */}
      {activeTab === 'salary' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className={`${tokens.card} p-4`}>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                <div>
                  <label className={tokens.label}>Select Month</label>
                  <select
                    value={salMonth}
                    onChange={(e) => setSalMonth(Number(e.target.value))}
                    className={tokens.input}
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={tokens.label}>Select Year</label>
                  <select
                    value={salYear}
                    onChange={(e) => setSalYear(Number(e.target.value))}
                    className={tokens.input}
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={tokens.label}>Employee Filter</label>
                  <select
                    value={salEmployeeId}
                    onChange={(e) => setSalEmployeeId(e.target.value)}
                    className={tokens.input}
                  >
                    <option value="All">All Employees (Company Payroll Sheet)</option>
                    {usersList.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.designation || u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportSalaryCSV}
                  disabled={salLoading || !salaryReportData}
                  className={tokens.btnSuccess}
                  title="Download Payroll Register as CSV / Excel"
                >
                  <HiOutlineArrowDownTray className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintSalaryPDF}
                  disabled={salLoading || !salaryReportData}
                  className={tokens.btnPrimary}
                  title="Print or Export Formatted Salary Sheet"
                >
                  <HiOutlinePrinter className="w-4 h-4 stroke-[2.5]" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Loading */}
          {salLoading ? (
            <div className={`${tokens.card} p-12 text-center`}>
              <div className="inline-block w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium mt-3">Calculating payroll records and deductions…</p>
            </div>
          ) : salaryReportData ? (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className={`${tokens.card} p-4 border-l-4 border-l-indigo-600`}>
                  <span className={tokens.label}>Total Gross Payroll</span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                    ₹{(salaryReportData.summary?.totalGrossPayroll || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-400">Total Base &amp; Allowances</span>
                </div>

                <div className={`${tokens.card} p-4 border-l-4 border-l-amber-500`}>
                  <span className={tokens.label}>Late Mark Deductions</span>
                  <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">
                    ₹{(salaryReportData.summary?.totalLateDeductions || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium">Excess late penalties</span>
                </div>

                <div className={`${tokens.card} p-4 border-l-4 border-l-rose-500`}>
                  <span className={tokens.label}>Statutory &amp; Other Ded.</span>
                  <div className="text-xl sm:text-2xl font-black text-rose-600 mt-0.5">
                    ₹{(salaryReportData.summary?.totalDeductions || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-rose-500 font-medium">PF, ESIC, PT, Late</span>
                </div>

                <div className={`${tokens.card} p-4 border-l-4 border-l-emerald-600`}>
                  <span className={tokens.label}>Total Net In-Hand Pay</span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
                    ₹{(salaryReportData.summary?.totalNetDisbursed || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {salaryReportData.summary?.paidCount} Paid • {salaryReportData.summary?.pendingCount} Pending
                  </span>
                </div>
              </div>

              {/* Data Table */}
              <div className={`${tokens.card} overflow-hidden`}>
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Monthly Salary Register &amp; Deductions Breakdown
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    {salaryReportData.period}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Employee Name</th>
                        <th className="px-3 py-3">Designation</th>
                        <th className="px-3 py-3">Attendance (P/L)</th>
                        <th className="px-3 py-3 text-right">Gross Salary</th>
                        <th className="px-3 py-3 text-right text-amber-700">Late Deduct.</th>
                        <th className="px-3 py-3 text-right">PF / ESIC / PT</th>
                        <th className="px-3 py-3 text-right text-rose-700">Total Deduct.</th>
                        <th className="px-4 py-3 text-right text-emerald-700 font-extrabold">Net In-Hand Pay</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {salaryReportData.salaries?.map((emp) => (
                        <tr key={emp._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="font-bold text-slate-900 block">{emp.employeeName}</span>
                            <span className="text-[10px] text-slate-400">{emp.email}</span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 font-medium">{emp.designation}</td>
                          <td className="px-3 py-2.5 font-mono">
                            <span className="text-emerald-700 font-bold">{emp.presentDays}P</span> /{' '}
                            <span className="text-amber-700 font-bold">{emp.lateDays}L</span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                            ₹{emp.grossEarnings?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-amber-700 font-bold">
                            {emp.lateDeduction > 0 ? `-₹${emp.lateDeduction?.toLocaleString('en-IN')}` : '₹0'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                            ₹{(emp.pfDeduction + emp.esicDeduction + emp.ptDeduction)?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-rose-600 font-bold">
                            -₹{emp.totalDeductions?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-sm font-black text-emerald-600">
                            ₹{emp.netPay?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                emp.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {emp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ============================================================
          TAB 3: PROJECT & TEAM WORK REPORT ("Kisne Kitna Kaam Kiya")
          ============================================================ */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className={`${tokens.card} p-4`}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="w-full sm:max-w-md">
                <label className={tokens.label}>Select Project</label>
                <select
                  value={projId}
                  onChange={(e) => setProjId(e.target.value)}
                  className={tokens.input}
                >
                  <option value="All">All Projects (Company Overview)</option>
                  {projectsList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportProjectCSV}
                  disabled={projLoading || !projectReportData}
                  className={tokens.btnSuccess}
                  title="Download Project Work Report as CSV / Excel"
                >
                  <HiOutlineArrowDownTray className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintProjectPDF}
                  disabled={projLoading || !projectReportData}
                  className={tokens.btnPrimary}
                  title="Print or Export Formatted Project PDF"
                >
                  <HiOutlinePrinter className="w-4 h-4 stroke-[2.5]" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Loading */}
          {projLoading ? (
            <div className={`${tokens.card} p-12 text-center`}>
              <div className="inline-block w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium mt-3">Compiling project milestones and time tracking sessions…</p>
            </div>
          ) : projectReportData ? (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {projectReportData.reportType === 'single_project' ? (
                  <>
                    <div className={`${tokens.card} p-4 border-l-4 border-l-indigo-600`}>
                      <span className={tokens.label}>Deliverables / Tasks</span>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                        {projectReportData.summary?.totalTasks} Tasks
                      </div>
                      <span className="text-[10px] text-indigo-600 font-medium">
                        {projectReportData.summary?.completedTasks} Resolved ({projectReportData.summary?.completionRate}%)
                      </span>
                    </div>

                    <div className={`${tokens.card} p-4 border-l-4 border-l-emerald-500`}>
                      <span className={tokens.label}>Total Productive Work</span>
                      <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
                        {projectReportData.summary?.totalLoggedHoursFormatted}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-medium">Total Tracked Work Time</span>
                    </div>

                    <div className={`${tokens.card} p-4 border-l-4 border-l-purple-500`}>
                      <span className={tokens.label}>Active Contributors</span>
                      <div className="text-xl sm:text-2xl font-black text-purple-600 mt-0.5">
                        {projectReportData.summary?.totalContributors} Members
                      </div>
                      <span className="text-[10px] text-purple-700 font-medium">Team Contribution Active</span>
                    </div>

                    <div className={`${tokens.card} p-4 border-l-4 border-l-amber-500`}>
                      <span className={tokens.label}>Top Work Contributor</span>
                      <div className="text-base sm:text-lg font-black text-amber-700 mt-0.5 truncate">
                        {projectReportData.summary?.topContributor}
                      </div>
                      <span className="text-[10px] text-slate-400">Highest Logged Hours</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`${tokens.card} p-4 border-l-4 border-l-indigo-600`}>
                      <span className={tokens.label}>Total Projects</span>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                        {projectReportData.summary?.totalProjects} Projects
                      </div>
                      <span className="text-[10px] text-slate-400">In Company Portfolio</span>
                    </div>

                    <div className={`${tokens.card} p-4 border-l-4 border-l-emerald-500`}>
                      <span className={tokens.label}>Active / Completed</span>
                      <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
                        {projectReportData.summary?.completedProjects} Done
                      </div>
                      <span className="text-[10px] text-indigo-600 font-medium">
                        {projectReportData.summary?.activeProjects} In Development
                      </span>
                    </div>

                    <div className={`${tokens.card} p-4 border-l-4 border-l-purple-500`}>
                      <span className={tokens.label}>Total Deliverables</span>
                      <div className="text-xl sm:text-2xl font-black text-purple-600 mt-0.5">
                        {projectReportData.summary?.totalTasks} Tasks
                      </div>
                      <span className="text-[10px] text-purple-700 font-medium">
                        {projectReportData.summary?.totalCompletedTasks} Completed
                      </span>
                    </div>

                    <div className={`${tokens.card} p-4 border-l-4 border-l-amber-500`}>
                      <span className={tokens.label}>Total Work Logged</span>
                      <div className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5">
                        {projectReportData.summary?.totalLoggedHoursFormatted}
                      </div>
                      <span className="text-[10px] text-amber-800 font-medium">Company Tracked Time</span>
                    </div>
                  </>
                )}
              </div>

              {/* Data Tables */}
              {projectReportData.reportType === 'single_project' ? (
                <div className="space-y-4">
                  {/* Table 1: Kisne Kitna Kaam Kiya (Team Member Work Breakdown) */}
                  <div className={`${tokens.card} overflow-hidden`}>
                    <div className="px-4 py-3 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                          👥
                        </div>
                        <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                          Team Work Breakdown — Kisne Kitna Kaam Kiya
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                        {projectReportData.project?.name}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Team Member</th>
                            <th className="px-3 py-3">Designation</th>
                            <th className="px-3 py-3">Tasks Assigned</th>
                            <th className="px-3 py-3 text-emerald-700">Completed</th>
                            <th className="px-3 py-3 font-mono">Productive Work Time</th>
                            <th className="px-4 py-3 text-right">Work Contribution %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {projectReportData.teamBreakdown?.map((member) => (
                            <tr key={member.userId} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3">
                                <span className="font-bold text-slate-900 block">{member.name}</span>
                                <span className="text-[10px] text-slate-400">{member.email}</span>
                              </td>
                              <td className="px-3 py-3 text-slate-600 font-medium">{member.designation}</td>
                              <td className="px-3 py-3 font-mono font-bold text-slate-800">{member.totalTasks}</td>
                              <td className="px-3 py-3 font-mono font-bold text-emerald-700">{member.completedTasks}</td>
                              <td className="px-3 py-3 font-mono font-black text-indigo-700 text-sm">
                                {member.productiveHoursFormatted}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-600 rounded-full"
                                      style={{ width: `${member.workContributionPercentage}%` }}
                                    />
                                  </div>
                                  <span className="font-mono font-bold text-slate-900 text-xs w-9 text-right">
                                    {member.workContributionPercentage}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Table 2: Detailed Task List */}
                  <div className={`${tokens.card} overflow-hidden`}>
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        All Tasks &amp; Timeline Targets
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Total {projectReportData.tasks?.length || 0} Deliverables
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Task Title</th>
                            <th className="px-3 py-3">Assignee</th>
                            <th className="px-3 py-3">Priority</th>
                            <th className="px-3 py-3">Due Date</th>
                            <th className="px-3 py-3">Logged Work</th>
                            <th className="px-4 py-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {projectReportData.tasks?.map((t) => (
                            <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-2.5 font-bold text-slate-900">{t.title}</td>
                              <td className="px-3 py-2.5 font-medium text-slate-700">{t.assigneeName}</td>
                              <td className="px-3 py-2.5">
                                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                  {t.priority}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 font-mono text-slate-600">{t.dueDate}</td>
                              <td className="px-3 py-2.5 font-mono font-bold text-indigo-700">
                                {t.loggedHoursFormatted}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    t.status === 'Completed'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  }`}
                                >
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* All Projects Table */
                <div className={`${tokens.card} overflow-hidden`}>
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Company Projects Overview &amp; Cumulative Hours
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500">
                      Portfolio Register
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Project Name</th>
                          <th className="px-3 py-3">Status</th>
                          <th className="px-3 py-3">Start Date</th>
                          <th className="px-3 py-3">End Date</th>
                          <th className="px-3 py-3">Tasks (Done/Total)</th>
                          <th className="px-3 py-3">Progress %</th>
                          <th className="px-4 py-3 text-right">Total Work Logged</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {projectReportData.projects?.map((p) => (
                          <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                            <td className="px-3 py-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.status === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 font-mono text-slate-600">{p.startDate}</td>
                            <td className="px-3 py-3 font-mono text-slate-600">{p.endDate}</td>
                            <td className="px-3 py-3 font-mono font-bold text-slate-800">
                              {p.completedTasks} / {p.totalTasks}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${p.completionRate}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[11px] font-bold text-slate-700">
                                  {p.completionRate}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700 text-sm">
                              {p.loggedHoursFormatted}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ReportsCenter;
