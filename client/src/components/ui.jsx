import { AlertCircle, CheckCircle2, Info, AlertTriangle, Loader2 } from 'lucide-react';

export const Button = ({ children, variant = 'primary', size = 'md', loading = false, disabled = false, className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-sm';
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20 hover:shadow-cyan-500/30 border border-white/10 hover:-translate-y-0.5',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 hover:border-slate-500',
    danger: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-900/20 hover:shadow-rose-500/30 border border-white/10 hover:-translate-y-0.5',
    ghost: 'text-slate-300 hover:bg-slate-800 hover:text-white shadow-none',
    link: 'text-cyan-400 hover:text-cyan-300 underline-offset-4 hover:underline shadow-none',
    white: 'bg-white text-slate-950 border border-white/20 hover:bg-slate-100 hover:-translate-y-0.5 shadow-sm',
  };
  const sizes = { sm: 'text-xs px-3 py-1.5 gap-1.5', md: 'text-sm px-4 py-2 gap-2', lg: 'text-[15px] px-5 py-2.5 gap-2' };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export const Input = ({ label, error, helper, icon: Icon, rightElement, className = '', inputClassName = '', ...props }) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-slate-200 mb-1.5">{label}</label>}
    <div className="relative">
      {Icon && <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Icon className="w-4 h-4 text-slate-400" /></div>}
      <input
        className={`block w-full text-sm bg-slate-950/80 border rounded-xl shadow-inner placeholder-slate-500 text-white transition-all duration-200
          focus:outline-none focus:ring-2 focus:border-transparent
          ${error ? 'border-rose-500 focus:ring-rose-500/40' : 'border-white/10 hover:border-white/20 focus:ring-cyan-500/40'}
          ${Icon ? 'pl-10' : 'px-3.5'} py-2.5 ${rightElement ? 'pr-10' : ''} ${inputClassName}
        `}
        {...props}
      />
      {rightElement && <div className="absolute inset-y-0 right-0 pr-2 flex items-center">{rightElement}</div>}
    </div>
    {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    {helper && !error && <p className="mt-1.5 text-xs text-slate-400">{helper}</p>}
  </div>
);

export const Textarea = ({ label, error, helper, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-slate-200 mb-1.5">{label}</label>}
    <textarea
      className={`block w-full px-3.5 py-2.5 text-sm bg-slate-950/80 border rounded-xl shadow-inner placeholder-slate-500 text-white transition-all duration-200 resize-none
        focus:outline-none focus:ring-2 focus:border-transparent
        ${error ? 'border-rose-500 focus:ring-rose-500/40' : 'border-white/10 hover:border-white/20 focus:ring-cyan-500/40'}
      `}
      {...props}
    />
    {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    {helper && !error && <p className="mt-1.5 text-xs text-slate-400">{helper}</p>}
  </div>
);

export const Select = ({ label, error, helper, className = '', children, ...props }) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-slate-200 mb-1.5">{label}</label>}
    <select
      className={`block w-full px-3.5 py-2.5 text-sm bg-slate-950/80 border rounded-xl shadow-inner text-white transition-all duration-200
        focus:outline-none focus:ring-2 focus:border-transparent cursor-pointer
        ${error ? 'border-rose-500 focus:ring-rose-500/40' : 'border-white/10 hover:border-white/20 focus:ring-cyan-500/40'}
      `}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    {helper && !error && <p className="mt-1.5 text-xs text-slate-400">{helper}</p>}
  </div>
);

export const Card = ({ children, className = '', hover = false, ...props }) => (
  <div
    className={`bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-xl shadow-black/30 ${hover ? 'hover:shadow-2xl hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-white/10 bg-white/[0.02] rounded-t-2xl ${className}`}>{children}</div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const badgeVariants = {
  admin: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  member: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  todo: 'bg-slate-700/50 text-slate-300 border-slate-600',
  in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  done: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  high: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  overdue: 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  default: 'bg-slate-800 text-slate-200 border-slate-600',
};

export const Badge = ({ children, variant = 'default', className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${badgeVariants[variant] || badgeVariants.default} ${className}`}>
    {children}
  </span>
);

const alertConfig = {
  error: { wrapper: 'bg-rose-500/10 border-rose-500/20 text-rose-300', icon: <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" /> },
  success: { wrapper: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> },
  warning: { wrapper: 'bg-amber-500/10 border-amber-500/20 text-amber-300', icon: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> },
  info: { wrapper: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300', icon: <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /> },
};

export const Alert = ({ children, variant = 'error', className = '' }) => {
  const cfg = alertConfig[variant];
  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border backdrop-blur-md shadow-md text-sm font-medium ${cfg.wrapper} ${className}`}>
      {cfg.icon}
      <span className="leading-snug">{children}</span>
    </div>
  );
};

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10 relative">
    <div className="relative z-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1.5 text-[15px] text-slate-400 font-medium">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0 relative z-10">{action}</div>}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-[#0f172a]/80 border border-white/10 rounded-2xl shadow-inner">
    {Icon && (
      <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center mb-5 shadow-sm">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
    )}
    <h3 className="text-[16px] font-bold text-slate-200 mb-1.5">{title}</h3>
    {description && <p className="text-[14px] text-slate-400 max-w-sm mb-6">{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

export const LoadingState = ({ label = 'Loading workspace...' }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4 animate-in">
    <div className="relative flex items-center justify-center w-12 h-12">
      <div className="absolute inset-0 rounded-xl border-t-2 border-cyan-500 animate-spin"></div>
      <Loader2 className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
    </div>
    <p className="text-sm text-slate-400 font-medium animate-pulse">{label}</p>
  </div>
);

export const Avatar = ({ name = '?', size = 'md', className = '' }) => {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };
  const colors = [
    'from-zinc-950 to-zinc-700', 'from-teal-600 to-emerald-600', 
    'from-amber-500 to-yellow-500', 'from-rose-500 to-orange-500',
    'from-sky-600 to-teal-600'
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${colors[colorIndex]} shadow-sm flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};
