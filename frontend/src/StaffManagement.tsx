import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from './config';
import { UserPlus, Search, X, CheckCircle, AlertTriangle, Shield } from "lucide-react";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    login_id: "",
    password: "",
    age: "",
    gender: "Male",
    qualification: ""
  });

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false, message: "", type: "success"
  });

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/admin/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaffList(res.data);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to load staff list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/admin/staff`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerToast("Staff created successfully!", "success");
      setShowModal(false);
      setFormData({ full_name: "", login_id: "", password: "", age: "", gender: "Male", qualification: "" });
      fetchStaff();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || "Error creating staff", "error");
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    s.login_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e293b] m-0 flex items-center gap-3">
            <Shield className="text-[#005EB8]" size={32} />
            Staff Management
          </h1>
          <p className="text-slate-500 mt-2">Manage faculty profiles and system access credentials.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#005EB8] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#004a94] transition-all shadow-md shadow-blue-100/50 border-none cursor-pointer"
        >
          <UserPlus size={18} /> Admit New Staff
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or login ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005EB8]/20 focus:border-[#005EB8] transition-all bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading staff data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Staff Details</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Login ID</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Profile Info</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500">No staff members found.</td></tr>
                ) : filteredStaff.map((staff) => (
                  <tr key={staff.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-[#005EB8] flex items-center justify-center font-bold">
                          {staff.full_name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{staff.full_name}</div>
                          <div className="text-xs text-slate-500">Joined: {new Date(staff.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-sm font-mono border border-slate-200">
                        {staff.login_id || staff.email || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-700">
                        {staff.staff_profile ? (
                          <>
                            <span className="font-semibold">{staff.staff_profile.qualification || 'N/A'}</span>
                            <span className="text-slate-400 mx-2">•</span>
                            {staff.staff_profile.age || '-'} yrs
                            <span className="text-slate-400 mx-2">•</span>
                            {staff.staff_profile.gender || '-'}
                          </>
                        ) : <span className="text-slate-400 italic">No profile data</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      {staff.is_active ? (
                         <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Active
                         </span>
                      ) : (
                         <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full w-max">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 m-0">Admit New Staff</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-1">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateStaff} className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Full Name</label>
                <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#005EB8] focus:ring-1 focus:ring-[#005EB8]" placeholder="Dr. Sarah Connor" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Login ID</label>
                  <input required type="text" value={formData.login_id} onChange={e => setFormData({...formData, login_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#005EB8] focus:ring-1 focus:ring-[#005EB8]" placeholder="staff_sarah" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Password</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#005EB8] focus:ring-1 focus:ring-[#005EB8]" placeholder="Leave blank to auto-generate" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Age</label>
                  <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#005EB8] focus:ring-1 focus:ring-[#005EB8]" placeholder="35" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Gender</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#005EB8] focus:ring-1 focus:ring-[#005EB8] bg-white">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Qualification</label>
                <input type="text" value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#005EB8] focus:ring-1 focus:ring-[#005EB8]" placeholder="e.g. PhD in Computer Science" />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#005EB8] hover:bg-[#004a94] transition-colors shadow-md shadow-blue-100/50 border-none cursor-pointer">Create Staff Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed top-5 right-5 bg-white px-6 py-4 rounded-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] border-l-4 z-[9999] flex items-center gap-3 animate-in slide-in-from-right-8" style={{ borderColor: toast.type === "success" ? "#10b981" : "#ef4444" }}>
          {toast.type === "success" ? <CheckCircle size={24} className="text-emerald-500" /> : <AlertTriangle size={24} className="text-red-500" />}
          <div>
            <h4 className="m-0 text-sm font-bold text-slate-800">{toast.type === "success" ? "Success" : "Error"}</h4>
            <p className="m-0 text-sm text-slate-500">{toast.message}</p>
          </div>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"><X size={16} /></button>
        </div>
      )}
    </div>
  );
}
