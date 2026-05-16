import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = () => (
  <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
    {/* Global dark background effects - subtly textured */}
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/5 blur-[120px]" />
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }}
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
