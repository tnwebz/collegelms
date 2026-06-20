import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, UserPlus, Settings } from "lucide-react";
import React, { useState } from "react";
import BrandLogo from "./components/BrandLogo";

const AdminDashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const menuItems = [
    { label: "Overview", path: "/admin-dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Staff Management", path: "/admin-dashboard/staff-management", icon: <UserPlus size={20} /> },
    { label: "Global Settings", path: "/admin-dashboard/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <BrandLogo size="md" />
            <span className="text-[11px] text-[#005EB8] font-bold uppercase tracking-widest mt-1">ADMIN</span>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 border-none cursor-pointer ${
                  isActive
                    ? "bg-[#005EB8] text-white shadow-md shadow-blue-100/50"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 bg-transparent"
                }`}
              >
                <div className={`${isActive ? "text-white" : "text-slate-400"}`}>
                  {item.icon}
                </div>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
          <h2 className="text-lg font-bold text-slate-800 m-0">Super Admin Portal</h2>
          <div className="flex items-center gap-4 relative">
             <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 rounded-full bg-[#005EB8] text-white flex items-center justify-center font-bold text-sm hover:ring-2 hover:ring-[#005EB8]/30 transition-all border-none cursor-pointer focus:outline-none"
             >
                AD
             </button>
             
             {showProfileMenu && (
               <div className="absolute top-10 right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2">
                 <div className="px-4 py-2 border-b border-slate-100">
                   <p className="text-sm font-bold text-slate-800 m-0">Admin User</p>
                   <p className="text-xs text-slate-500 m-0">admin@stjosephs.edu</p>
                 </div>
                 <button onClick={() => { setShowProfileMenu(false); navigate("/admin-dashboard/settings"); }} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2">
                   <Settings size={16} /> Settings
                 </button>
                 <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2">
                   <LogOut size={16} /> Logout
                 </button>
               </div>
             )}
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto bg-slate-50 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
