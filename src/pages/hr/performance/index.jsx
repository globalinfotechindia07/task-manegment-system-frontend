import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  HiOutlineArrowDownTray,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineCalendarDays,
  HiOutlineDocumentChartBar,
} from 'react-icons/hi2';
import api from '../../../api/axios';

const HRPerformance = () => {
  const [groupBy, setGroupBy] = useState('Period'); // Period, Employee
  const [filterPeriod, setFilterPeriod] = useState('Monthly'); // Monthly, Quarterly, Yearly
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterTeam, setFilterTeam] = useState('All');
  const [filterUser, setFilterUser] = useState('All');

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    },
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const departments = useMemo(
    () => Array.from(new Set(users.map((u) => u.department).filter(Boolean))),
    [users]
  );
  const teams = useMemo(() => users.filter((u) => u.role === 'Team Head'), [users]);
  const employees = useMemo(
    () => users.filter((u) => u.role === 'User' || u.role === 'Team Head'),
    [users]
  );

  const performanceData = useMemo(() => {
    const now = new Date();

    let filteredTasks = tasks.filter((task) => {
      const assignedUser = users.find((u) => u._id === task.assignedTo?._id);
      if (!assignedUser) return false;

      let matchDept = filterDepartment === 'All' || assignedUser.department === filterDepartment;
      let matchTeam =
        filterTeam === 'All' ||
        assignedUser.teamHead?._id === filterTeam ||
        assignedUser.teamHead === filterTeam;
      let matchUser = filterUser === 'All' || assignedUser._id === filterUser;

      return matchDept && matchTeam && matchUser;
    });

    const groups = {};

    filteredTasks.forEach((task) => {
      let groupKey = '';
      let groupLabel = '';

      if (groupBy === 'Period') {
        if (!task.createdAt) return;
        const date = new Date(task.createdAt);
        if (filterPeriod === 'Monthly') {
          groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          groupLabel = groupKey;
        } else if (filterPeriod === 'Quarterly') {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          groupKey = `${date.getFullYear()}-Q${quarter}`;
          groupLabel = groupKey;
        } else if (filterPeriod === 'Yearly') {
          groupKey = `${date.getFullYear()}`;
          groupLabel = groupKey;
        }
      } else if (groupBy === 'Employee') {
        const assignedUser = users.find((u) => u._id === task.assignedTo?._id);
        if (!assignedUser) return;
        groupKey = assignedUser._id;
        groupLabel = assignedUser.name;
      }

      if (!groupKey) return;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          label: groupLabel,
          total: 0,
          completed: 0,
          overdue: 0,
          pending: 0,
          delayed: 0,
        };
      }

      groups[groupKey].total++;

      if (task.status === 'Completed') {
        groups[groupKey].completed++;
      } else {
        groups[groupKey].pending++;
      }

      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (task.status !== 'Completed' && dueDate < now) {
          groups[groupKey].overdue++;
        }
        if (task.status === 'Completed' && task.history) {
          const completedLog = task.history.find((h) =>
            h.action.includes('status updated to Completed')
          );
          if (completedLog && new Date(completedLog.createdAt) > dueDate) {
            groups[groupKey].delayed++;
          }
        }
      }
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => ({
        key,
        label: groups[key].label,
        total: groups[key].total,
        completed: groups[key].completed,
        pending: groups[key].pending,
        overdue: groups[key].overdue,
        delayed: groups[key].delayed,
        completionRate:
          groups[key].total > 0
            ? ((groups[key].completed / groups[key].total) * 100).toFixed(1)
            : 0,
      }));
  }, [tasks, users, filterPeriod, filterDepartment, filterTeam, filterUser, groupBy]);

  const exportCSV = () => {
    const headerTitle = groupBy === 'Period' ? 'Period' : 'Employee Name';
    const headers = [
      headerTitle,
      'Total Tasks',
      'Completed',
      'Pending',
      'Overdue (Active)',
      'Delayed (Completed late)',
      'Completion Rate (%)',
    ];
    const csvContent = [
      headers.join(','),
      ...performanceData.map((row) =>
        [
          `"${row.label}"`,
          row.total,
          row.completed,
          row.pending,
          row.overdue,
          row.delayed,
          row.completionRate,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `performance_report_${groupBy.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoadingTasks || isLoadingUsers) {
    return (
      <div className="flex justify-center items-center py-16 min-h-[400px]">
        <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Reusable classes
  const selectBase =
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors cursor-pointer';
  const labelBase =
    'block text-[10px] sm:text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Performance Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Analyze task completion rates and productivity trends.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg font-semibold text-xs sm:text-sm transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <HiOutlineArrowDownTray className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* ===================== FILTERS ===================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 shadow-sm grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className={labelBase}>Group By</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className={selectBase}>
            <option value="Period">Period</option>
            <option value="Employee">Employee</option>
          </select>
        </div>
        <div>
          <label className={labelBase}>Period</label>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className={selectBase}
          >
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label className={labelBase}>Department</label>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className={selectBase}
          >
            <option value="All">All</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={labelBase}>Team Head</label>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className={selectBase}
          >
            <option value="All">All Teams</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={labelBase}>Employee</label>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className={selectBase}
          >
            <option value="All">All Employees</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===================== PERFORMANCE TABLE / LIST ===================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {performanceData.length === 0 ? (
          <div className="p-10 sm:p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <HiOutlineDocumentChartBar className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">No performance data</p>
            <p className="text-xs text-slate-500">
              No records available for the selected filters. Try adjusting them.
            </p>
          </div>
        ) : (
          <>
            {/* ---------- MOBILE CARD VIEW (< md) ---------- */}
            <div className="md:hidden divide-y divide-slate-100">
              {performanceData.map((row) => {
                const rate = parseFloat(row.completionRate);
                return (
                  <div key={row.key} className="p-4 hover:bg-slate-50/60 transition-colors">
                    {/* Header: label + completion rate */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-xs truncate">
                          {row.label}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {groupBy === 'Period' ? filterPeriod : 'Employee'} Report
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${rate >= 80
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : rate >= 50
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                      >
                        {row.completionRate}%
                      </span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-1.5 mb-2.5 text-center">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                        <p className="text-[9px] text-slate-500 uppercase font-semibold">Total</p>
                        <p className="text-xs font-bold text-slate-900 font-mono">{row.total}</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-1.5">
                        <p className="text-[9px] text-emerald-700 uppercase font-semibold">
                          Done
                        </p>
                        <p className="text-xs font-bold text-emerald-700 font-mono">
                          {row.completed}
                        </p>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-1.5">
                        <p className="text-[9px] text-rose-700 uppercase font-semibold">Late</p>
                        <p className="text-xs font-bold text-rose-700 font-mono">{row.overdue}</p>
                      </div>
                    </div>

                    {/* Completion bar */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">
                          Completion
                        </span>
                        {row.delayed > 0 && (
                          <span className="text-[9px] text-amber-600 font-semibold">
                            {row.delayed} delayed
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                          style={{ width: `${row.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ---------- DESKTOP TABLE (md+) ---------- */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 min-w-[800px]">
                <thead className="bg-slate-50 text-slate-700 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold whitespace-nowrap">
                      {groupBy === 'Period' ? `${filterPeriod} Period` : 'Employee Name'}
                    </th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold text-center whitespace-nowrap">
                      Total
                    </th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold text-center text-emerald-600 whitespace-nowrap">
                      Completed
                    </th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold text-center text-rose-600 whitespace-nowrap">
                      Overdue
                    </th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold text-center text-amber-600 whitespace-nowrap">
                      Delayed
                    </th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold text-right whitespace-nowrap">
                      Completion Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {performanceData.map((row) => {
                    const rate = parseFloat(row.completionRate);
                    return (
                      <tr key={row.key} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 lg:px-6 py-3.5">
                          <span className="font-semibold text-slate-900 text-xs truncate max-w-[220px] block">
                            {row.label}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3.5 text-center font-semibold text-slate-800 font-mono text-xs">
                          {row.total}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5 text-center text-emerald-600 font-semibold font-mono text-xs">
                          {row.completed}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5 text-center text-rose-600 font-semibold font-mono text-xs">
                          {row.overdue}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5 text-center text-amber-600 font-semibold font-mono text-xs">
                          {row.delayed}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5">
                          <div className="flex items-center justify-end gap-2.5">
                            <div className="w-20 lg:w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                              <div
                                className={`h-full rounded-full ${rate >= 80
                                  ? 'bg-emerald-500'
                                  : rate >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                  }`}
                                style={{ width: `${row.completionRate}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-900 text-xs font-mono w-12 text-right">
                              {row.completionRate}%
                            </span>
                          </div>
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
  );
};

export default HRPerformance;