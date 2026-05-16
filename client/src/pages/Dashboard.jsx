import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { CheckSquare, AlertTriangle, RefreshCw, LayoutGrid, Users } from 'lucide-react';
import { subDays, formatISO } from 'date-fns';

const SKELETON = <div className="w-full h-full dash-skeleton rounded-2xl min-h-[140px] border border-[var(--dash-border)]"></div>;

const ErrorBox = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center p-4 h-full text-center">
    <p className="text-[var(--dash-red)] text-sm mb-3 font-medium">{error || 'Failed to load'}</p>
    <button onClick={onRetry} className="px-3 py-1.5 text-xs font-semibold text-white bg-[var(--dash-red)]/20 hover:bg-[var(--dash-red)]/30 rounded border border-[var(--dash-red)]/30 transition-colors">
      Retry
    </button>
  </div>
);

const useAnimatedNumber = (end, duration = 900) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    setValue(0);
    if (!end) return;
    let startTimestamp = null;
    let animationFrameId;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(easeOut * end));
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setValue(end);
      }
    };
    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [end, duration]);
  return value;
};

const CardBase = ({ children, className = '' }) => (
  <div className={`bg-[var(--dash-surface)] border border-[var(--dash-border)] rounded-[16px] p-[24px] transition-transform duration-150 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${className}`}>
    {children}
  </div>
);

const KPICard = ({ title, value, subtext, colorVar, className = '', loading, error, onRetry, children }) => {
  if (loading) return SKELETON;
  if (error) return <CardBase className={`h-[140px] flex items-center justify-center ${className}`}><ErrorBox error={error} onRetry={onRetry} /></CardBase>;
  return (
    <CardBase className={`h-[140px] flex flex-col justify-between ${className}`}>
      <h3 className="text-sm font-semibold text-[var(--dash-muted)]">{title}</h3>
      <div>
        {children || <div className="text-[48px] font-bold leading-none mb-1" style={{ color: `var(${colorVar})` }}>{value}</div>}
        {subtext && <p className="text-[14px] text-[var(--dash-muted)]">{subtext}</p>}
      </div>
    </CardBase>
  );
};

const DonutChart = ({ statuses }) => {
  const total = statuses.reduce((acc, s) => acc + s.count, 0);
  let accumulatedPercent = 0;
  
  const colors = {
    'TODO': 'var(--dash-accent)',
    'IN_PROGRESS': 'var(--dash-violet)',
    'DONE': 'var(--dash-teal)'
  };

  const gradientStops = statuses.map(s => {
    const start = accumulatedPercent;
    const end = start + s.percent;
    accumulatedPercent = end;
    const color = colors[s.code] || 'var(--dash-muted)';
    return `${color} ${start}% ${end}%`;
  }).join(', ');

  const bg = statuses.length === 0 ? 'var(--dash-surface)' : `conic-gradient(${gradientStops})`;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 justify-center h-full animate-in" style={{ animationDuration: '300ms' }}>
      <div className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-lg" style={{ background: bg, clipPath: 'circle(50%)' }}>
        <div className="absolute w-[70%] h-[70%] bg-[var(--dash-surface)] rounded-full flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{total}</span>
          <span className="text-xs text-[var(--dash-muted)] font-medium uppercase tracking-wider">tasks</span>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {statuses.map(s => (
          <div key={s.code} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: colors[s.code] || 'gray' }}></div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[var(--dash-text)]">{s.label}</span>
              <span className="text-xs text-[var(--dash-muted)] font-medium">{s.count} tasks ({s.percent}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UserAvatar = ({ name, id }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  const colors = ['#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#073B4C'];
  const colorIndex = (id ? id.charCodeAt(0) + id.charCodeAt(id.length - 1) : 0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-inner" style={{ backgroundColor: bgColor }}>
      {initials}
    </div>
  );
};

const UserBar = ({ user, maxAssigned, index }) => {
  const [width, setWidth] = useState(0);
  const targetPct = maxAssigned > 0 ? (user.assigned / maxAssigned) * 100 : 0;
  const compPct = user.assigned > 0 ? (user.completed / user.assigned) * 100 : 0;

  useEffect(() => {
    const timer = setTimeout(() => setWidth(targetPct), index * 80 + 100);
    return () => clearTimeout(timer);
  }, [targetPct, index]);

  return (
    <div className="flex items-center gap-4 py-2">
      <UserAvatar name={user.name} id={user.id} />
      <div className="w-24 truncate text-sm font-semibold text-[var(--dash-text)] shrink-0">{user.name}</div>
      <div className="flex-1 relative h-2.5 bg-[var(--dash-bg)] rounded-full overflow-hidden border border-[var(--dash-border)]">
        <div 
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, background: 'linear-gradient(90deg, var(--dash-violet), var(--dash-accent))' }}
        >
           <div className="absolute top-0 left-0 h-full bg-[var(--dash-teal)] rounded-full transition-all duration-700 ease-out" style={{ width: `${compPct}%` }} />
        </div>
      </div>
      <div className="w-8 text-right text-sm font-bold text-[var(--dash-text)] shrink-0">{user.assigned}</div>
    </div>
  );
};

const Dashboard = () => {
  const [dateRange, setDateRange] = useState('30');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [summary, setSummary] = useState({ data: null, loading: true, error: null });
  const [byStatus, setByStatus] = useState({ data: null, loading: true, error: null });
  const [byUser, setByUser] = useState({ data: null, loading: true, error: null });
  const [overdue, setOverdue] = useState({ data: null, loading: true, error: null });

  const getDates = () => {
    if (dateRange === 'all') return { from: '', to: '' };
    const days = parseInt(dateRange);
    const from = formatISO(subDays(new Date(), days));
    const to = formatISO(new Date());
    return { from, to };
  };

  const fetchSummary = useCallback(async () => {
    setSummary(prev => ({ ...prev, loading: true }));
    try {
      const { from, to } = getDates();
      const res = await api.get('/dashboard/summary', { params: { from, to } });
      if (res.data.error) throw new Error(res.data.error);
      setSummary({ data: res.data.data, loading: false, error: null });
    } catch (err) {
      setSummary({ data: null, loading: false, error: err.message });
    }
  }, [dateRange, refreshTrigger]);

  const fetchByStatus = useCallback(async () => {
    setByStatus(prev => ({ ...prev, loading: true }));
    try {
      const { from, to } = getDates();
      const res = await api.get('/dashboard/by-status', { params: { from, to } });
      if (res.data.error) throw new Error(res.data.error);
      setByStatus({ data: res.data.data, loading: false, error: null });
    } catch (err) {
      setByStatus({ data: null, loading: false, error: err.message });
    }
  }, [dateRange, refreshTrigger]);

  const fetchByUser = useCallback(async () => {
    setByUser(prev => ({ ...prev, loading: true }));
    try {
      const { from, to } = getDates();
      const res = await api.get('/dashboard/by-user', { params: { from, to } });
      if (res.data.error) throw new Error(res.data.error);
      setByUser({ data: res.data.data, loading: false, error: null });
    } catch (err) {
      setByUser({ data: null, loading: false, error: err.message });
    }
  }, [dateRange, refreshTrigger]);

  const fetchOverdue = useCallback(async () => {
    setOverdue(prev => ({ ...prev, loading: true }));
    try {
      const { from, to } = getDates();
      const res = await api.get('/dashboard/overdue', { params: { from, to } });
      if (res.data.error) throw new Error(res.data.error);
      setOverdue({ data: res.data.data, loading: false, error: null });
    } catch (err) {
      setOverdue({ data: null, loading: false, error: err.message });
    }
  }, [dateRange, refreshTrigger]);

  useEffect(() => {
    fetchSummary();
    fetchByStatus();
    fetchByUser();
    fetchOverdue();
  }, [fetchSummary, fetchByStatus, fetchByUser, fetchOverdue]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const totalTasksCount = summary.data?.totalTasks || 0;
  const animatedTotal = useAnimatedNumber(totalTasksCount);

  return (
    <div className="bg-[var(--dash-bg)] min-h-screen text-[var(--dash-text)] font-sans pb-12">
      <div className="max-w-[1600px] mx-auto px-6 pt-8 space-y-6">
        
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ animation: 'fadeSlideUp 400ms ease both', animationDelay: '80ms' }}>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-sm text-[var(--dash-muted)] mt-1">Overview of your team's progress</p>
          </div>
          <div className="flex items-center gap-2 bg-[var(--dash-surface)] p-1 rounded-xl border border-[var(--dash-border)]">
            {[
              { label: '7 days', val: '7' },
              { label: '30 days', val: '30' },
              { label: '90 days', val: '90' }
            ].map(btn => (
              <button
                key={btn.val}
                onClick={() => setDateRange(btn.val)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${dateRange === btn.val ? 'bg-[var(--dash-bg)] text-[var(--dash-accent)] border border-[var(--dash-accent)]/30 shadow-sm' : 'text-[var(--dash-muted)] hover:text-white'}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div style={{ animation: 'fadeSlideUp 400ms ease both', animationDelay: '180ms' }}>
            <KPICard 
              title="Total Tasks" 
              loading={summary.loading} 
              error={summary.error} 
              onRetry={fetchSummary}
              value={animatedTotal}
              colorVar="--dash-accent"
              subtext={`${summary.data?.openTasks || 0} open · ${summary.data?.inProgressTasks || 0} in progress · ${summary.data?.completedTasks || 0} done`}
            />
          </div>
          
          <div style={{ animation: 'fadeSlideUp 400ms ease both', animationDelay: '240ms' }}>
            <KPICard 
              title="Completion Rate" 
              loading={summary.loading} 
              error={summary.error} 
              onRetry={fetchSummary}
              value={`${summary.data?.completionRate || 0}%`}
              colorVar="--dash-teal"
              subtext="Percentage of tasks done"
            />
          </div>

          <div style={{ animation: 'fadeSlideUp 400ms ease both', animationDelay: '300ms' }}>
            <KPICard 
              title="Overdue Tasks" 
              className={summary.data?.overdueCount > 0 ? "animate-[overdue-pulse_2s_ease-in-out_infinite]" : ""}
              loading={summary.loading} 
              error={summary.error} 
              onRetry={fetchSummary}
              value={summary.data?.overdueCount || 0}
              colorVar={summary.data?.overdueCount > 0 ? "--dash-red" : "--dash-accent"}
              subtext={summary.data?.overdueCount > 0 ? "Needs immediate attention" : "Everything is on track"}
            />
          </div>

          <div style={{ animation: 'fadeSlideUp 400ms ease both', animationDelay: '360ms' }}>
            <KPICard 
              title="In Progress" 
              loading={summary.loading} 
              error={summary.error} 
              onRetry={fetchSummary}
              value={summary.data?.inProgressTasks || 0}
              colorVar="--dash-violet"
              subtext="Tasks currently active"
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-4">
          <div style={{ animation: 'fadeSlideUp 400ms ease both', animationDelay: '460ms' }}>
            <CardBase className="h-[360px] flex flex-col">
              <h3 className="text-sm font-semibold text-[var(--dash-text)] mb-6">Task by Status</h3>
              <div className="flex-1">
                {byStatus.loading ? SKELETON : byStatus.error ? <ErrorBox error={byStatus.error} onRetry={fetchByStatus} /> : (
                  <DonutChart statuses={byStatus.data?.statuses || []} />
                )}
              </div>
            </CardBase>
          </div>

          <div style={{ animation: 'fadeSlideUp 400ms ease both', animationDelay: '520ms' }}>
             <CardBase className="h-[360px] flex flex-col">
              <h3 className="text-sm font-semibold text-[var(--dash-text)] mb-4">Task per User</h3>
              <div className="flex-1 overflow-y-auto pr-2">
                {byUser.loading ? SKELETON : byUser.error ? <ErrorBox error={byUser.error} onRetry={fetchByUser} /> : (
                  <div className="space-y-1">
                    {byUser.data?.users?.length > 0 ? (() => {
                      const maxA = Math.max(...byUser.data.users.map(u => u.assigned));
                      return byUser.data.users.map((u, i) => (
                        <UserBar key={u.id} user={u} maxAssigned={maxA} index={i} />
                      ));
                    })() : (
                      <div className="text-sm text-[var(--dash-muted)] text-center mt-10">No users found.</div>
                    )}
                  </div>
                )}
              </div>
            </CardBase>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ animation: 'fadeSlideUp 400ms ease both', animationDelay: '620ms' }}>
          <CardBase className="min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-[var(--dash-text)]">Overdue Tasks</h3>
              <span className="text-xs bg-[var(--dash-red)]/10 text-[var(--dash-red)] px-2 py-1 rounded font-bold border border-[var(--dash-red)]/20">
                {overdue.data?.tasks?.length || 0} Total
              </span>
            </div>
            
            {overdue.loading ? SKELETON : overdue.error ? <ErrorBox error={overdue.error} onRetry={fetchOverdue} /> : (
              overdue.data?.tasks?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center bg-[var(--dash-bg)] rounded-xl border border-[var(--dash-border)] border-dashed">
                  <div className="w-12 h-12 bg-[var(--dash-accent)]/10 rounded-full flex items-center justify-center mb-3">
                    <CheckSquare className="w-6 h-6 text-[var(--dash-accent)]" />
                  </div>
                  <p className="text-sm font-bold text-[var(--dash-text)] mb-1">No overdue tasks — you're on track 🎯</p>
                  <p className="text-xs text-[var(--dash-muted)]">All deadlines are being met.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--dash-border)]">
                        <th className="pb-3 text-xs font-semibold text-[var(--dash-muted)]">Task</th>
                        <th className="pb-3 text-xs font-semibold text-[var(--dash-muted)]">Assignee</th>
                        <th className="pb-3 text-xs font-semibold text-[var(--dash-muted)]">Days Late</th>
                        <th className="pb-3 text-xs font-semibold text-[var(--dash-muted)]">Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdue.data?.tasks?.map(task => {
                        let lateStyle = "bg-[var(--dash-red)]/15 text-[var(--dash-red)]";
                        if (task.daysLate <= 3) lateStyle = "bg-[rgba(245,166,35,0.15)] text-[var(--dash-amber)]";
                        else if (task.daysLate <= 7) lateStyle = "bg-[rgba(255,100,0,0.15)] text-[#FF6400]";

                        let prioStyle = "bg-slate-800 text-[var(--dash-muted)]";
                        if (task.priority === 'HIGH') prioStyle = "bg-[var(--dash-red)]/15 text-[var(--dash-red)] border border-[var(--dash-red)]/20";
                        else if (task.priority === 'MEDIUM') prioStyle = "bg-[var(--dash-amber)]/15 text-[var(--dash-amber)] border border-[var(--dash-amber)]/20";

                        return (
                          <tr key={task.id} className="border-b border-[var(--dash-border)] last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 pr-4">
                              <p className="text-sm font-bold text-[var(--dash-text)] truncate max-w-[200px]">{task.title}</p>
                              <p className="text-xs text-[var(--dash-muted)] truncate max-w-[200px]">{task.projectName}</p>
                            </td>
                            <td className="py-4 pr-4">
                              <span className="text-sm font-medium text-[var(--dash-text)]">{task.assignee}</span>
                            </td>
                            <td className="py-4 pr-4">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${lateStyle}`}>
                                {task.daysLate}d
                              </span>
                            </td>
                            <td className="py-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${prioStyle}`}>
                                {task.priority}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </CardBase>
          
          {/* Recent Activity feed hidden as per instructions (doesn't exist) */}
          <div className="hidden"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
