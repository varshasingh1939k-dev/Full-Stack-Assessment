import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = () => (
  <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-lime-500/8 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-500/8 blur-[120px]" />
      <div className="absolute inset-0 opacity-[0.20]"
        style={{ backgroundImage: 'radial-gradient(ellipse at 22% 18%, rgba(163,230,53,0.28), transparent 34%), radial-gradient(ellipse at 82% 78%, rgba(232,121,249,0.24), transparent 38%), linear-gradient(145deg, rgba(56,189,248,0.16), transparent 36%, rgba(15,23,42,0.08) 58%, rgba(163,230,53,0.10))' }}
      />
    </div>

    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0 relative z-10 h-screen overflow-y-auto">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-in">
          <Outlet />
        </div>
      </main>
    </div>
  </div>
);

export default Layout;
