import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, UserPlus, PlusCircle, LogOut, Bell,
  ChevronRight, Code, Menu, Settings, Users, FolderOpen, MessageSquare, Layers
} from "lucide-react";
import BrandLogo from "./components/BrandLogo";
import axios from "axios";
import API_BASE_URL from "./config";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ Profile Dropdown State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userData, setUserData] = useState({ name: "Loading...", email: "...", profile_picture: "" });

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      setUserData({
        name: res.data.full_name || "User",
        email: res.data.email || "",
        profile_picture: res.data.profile_picture || ""
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProfile();
    window.addEventListener("profileUpdated", fetchProfile);
    return () => window.removeEventListener("profileUpdated", fetchProfile);
  }, []);

  const menuItems = [
    { label: "Home", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "My Courses", path: "/dashboard/courses", icon: <BookOpen size={20} /> },
    { label: "Batches", path: "/dashboard/batches", icon: <Layers size={20} /> },
    { label: "Create Course", path: "/dashboard/create-course", icon: <PlusCircle size={20} /> },
    { label: "Code Arena", path: "/dashboard/code-arena", icon: <Code size={20} /> },
    { label: "Students", path: "/dashboard/students", icon: <Users size={20} /> },
    // ✅ NEW: Assignment Verification Link
    { label: "Verify Assignments", path: "/dashboard/assignments", icon: <FolderOpen size={20} /> },
    { label: "Messages", path: "/dashboard/messages", icon: <MessageSquare size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-slate-200 font-sans">

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-50 border-r border-slate-300 shadow-xl transition-all duration-300 lg:static lg:shadow-none
            ${mobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"} 
            ${collapsed ? "lg:w-20" : "lg:w-72"}
        `}
      >

        {/* LOGO SECTION */}
        <div className={`p-6 border-b border-slate-300 flex items-center gap-2 ${collapsed ? "lg:justify-center lg:px-2" : "justify-between"}`}>
          {(!collapsed || mobileMenuOpen) && (
            <div>
              <BrandLogo size="md" />
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-widest block mt-1">
                Instructor
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <Menu size={24} />
          </button>
          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname === item.path + "/";

            return (
              <div
                key={item.path}
                onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                title={collapsed ? item.label : ""}
                className={`flex items-center p-3.5 rounded-xl cursor-pointer transition-all duration-200 group
                    ${collapsed ? "justify-center" : "justify-between"}
                    ${isActive ? "bg-slate-100 text-[#005EB8] shadow-sm font-bold" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-medium"}
                `}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>{item.icon}</div>
                  {(!collapsed || mobileMenuOpen) && <span className="text-[15px]">{item.label}</span>}
                </div>
                {(!collapsed || mobileMenuOpen) && isActive && <ChevronRight size={16} className="text-[#005EB8]" strokeWidth={3} />}
              </div>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="p-5 border-t border-slate-300">
          <div
            onClick={handleLogout}
            className={`flex items-center gap-3 p-3 text-slate-500 cursor-pointer font-semibold rounded-lg transition-colors hover:bg-red-50 hover:text-red-500
                ${collapsed ? "justify-center" : "justify-start"}
            `}
          >
            <LogOut size={20} strokeWidth={2} /> {(!collapsed || mobileMenuOpen) && <span>Sign Out</span>}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">

        {/* HEADER */}
        <header className="h-20 bg-slate-50 border-b border-slate-300 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600">
              <Menu size={24} />
            </button>
            <h1 className="text-xl lg:text-2xl font-bold text-[#1e293b]">
              {menuItems.find(i => i.path === location.pathname)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <button className="p-2 rounded-full hover:bg-slate-200 transition-colors relative">
              <Bell size={22} className="text-slate-500" strokeWidth={2} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* PROFILE DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full border-2 border-slate-200 overflow-hidden bg-[#005EB8] text-white flex items-center justify-center font-bold text-sm shadow-sm hover:ring-2 ring-[#005EB8]/30 transition-all border-none cursor-pointer"
              >
                {userData.profile_picture ? (
                    <img src={userData.profile_picture.startsWith('http') ? userData.profile_picture : `${API_BASE_URL.replace('/api/v1', '')}${userData.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    userData.name.charAt(0).toUpperCase()
                )}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-14 w-64 bg-slate-50 rounded-xl shadow-2xl p-4 z-[100] border border-slate-200 animate-fade-in-up">
                  <div className="mb-4 border-b border-slate-200 pb-4">
                    <p className="font-bold text-[#1e293b] truncate" title={userData.name}>{userData.name}</p>
                    <p className="text-sm text-slate-500 truncate" title={userData.email}>{userData.email}</p>
                  </div>
                  <div className="space-y-1">
                    <button onClick={() => { navigate("/dashboard/settings"); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors font-semibold border-none cursor-pointer bg-transparent">
                      <Settings size={18} /> Account Settings
                    </button>
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-red-50 text-red-500 text-sm font-bold transition-colors text-left mt-1">
                    <LogOut size={18} /> Logout
                  </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 p-4 lg:p-10 overflow-y-auto overflow-x-hidden bg-slate-200">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;