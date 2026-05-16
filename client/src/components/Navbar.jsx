import { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, Menu, X, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { Avatar } from './ui';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
  ];

  const isActive = (path) => location.pathname === path || (path === '/projects' && location.pathname.startsWith('/projects'));

  let pageTitle = 'Overview';
  if (location.pathname.startsWith('/projects')) pageTitle = 'Projects';
  if (location.pathname.startsWith('/dashboard')) pageTitle = 'Dashboard';

  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-xl border-b border-white/10 shadow-sm transition-all">
      <div className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
      
      <div className="hidden sm:flex items-center gap-2">
        <h1 className="text-lg font-bold text-white">{pageTitle}</h1>
      </div>

      <div className="hidden sm:flex items-center gap-3">
         {isAdmin && (
          <Link to="/projects" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-lime-300 text-slate-950 text-[13px] font-black hover:bg-lime-200 transition-colors">
            <Plus className="w-4 h-4" /> New
          </Link>
         )}
         <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/85 border border-white/10 shadow-inner">
           <Avatar name={user.name} size="sm" />
           <span className="text-[13px] font-bold text-slate-200 pr-1">{user.name}</span>
         </div>
         <button onClick={logout} className="p-2.5 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors" title="Sign out">
          <LogOut className="w-4 h-4" />
         </button>
      </div>

      <div className="sm:hidden flex items-center justify-between w-full">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-lime-400 via-sky-400 to-fuchsia-500 shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[14px] font-extrabold text-white tracking-wide">
            FlowDesk
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-400 hover:bg-white/5 transition-colors focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          
          <div className="relative w-[280px] max-w-[80%] bg-slate-950/95 h-full shadow-2xl border-r border-white/10 flex flex-col animate-in slide-in-from-left">
            <div className="p-6 border-b border-white/5 relative overflow-hidden">
               <div className="flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-lime-400 via-sky-400 to-fuchsia-500 shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[15px] font-extrabold text-white block leading-tight">FlowDesk</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{isAdmin ? 'Admin Workspace' : 'Member Workspace'}</span>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>
               </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 space-y-8">
              <div className="px-4">
                <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Menu</p>
                <div className="space-y-1">
                  {navLinks.map(({ to, label, icon: Icon }) => {
                    const active = isActive(to);
                    return (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all relative overflow-hidden ${
                          active
                            ? 'bg-lime-400/10 text-white border border-lime-400/20 shadow-sm'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-lime-300 via-sky-300 to-fuchsia-400 rounded-r-full" />}
                        <Icon className={`w-4 h-4 ${active ? 'text-lime-300' : 'text-slate-500'}`} />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
              
              <div className="px-4">
                <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Actions</p>
                <div className="space-y-1">
                  {isAdmin ? (
                    <>
                      <Link to="/projects" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-lime-300 hover:bg-lime-400/10 transition-all">
                        <Plus className="w-4 h-4" /> Create Project
                      </Link>
                      <button onClick={() => { window.location.reload(); setMobileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent transition-all">
                        <RefreshCw className="w-4 h-4" /> Refresh Workspace
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-lime-300 hover:bg-lime-400/10 transition-all">
                        <LayoutDashboard className="w-4 h-4" /> My Dashboard
                      </Link>
                      <Link to="/projects" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-emerald-400 hover:bg-emerald-500/10 transition-all">
                        <FolderKanban className="w-4 h-4" /> My Projects
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </nav>

            <div className="p-4 border-t border-white/5 bg-white/[0.01]">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors border border-transparent hover:border-rose-500/20"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
