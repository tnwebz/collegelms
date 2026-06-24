import { useState, useEffect } from "react";
import axios from "axios";
import { Search, Edit2, Trash2, KeyRound, X } from "lucide-react";
import API_BASE_URL from './config';



export const ManageHod = ({ onSuccess }: { onSuccess: (msg: string, type: "success" | "error") => void }) => {
  const [hods, setHods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ department: "" });
  const [options, setOptions] = useState({ departments: [] as string[] });
  
  const [editModal, setEditModal] = useState<any>(null);
  const [passwordModal, setPasswordModal] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  const fetchHods = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (filters.department) queryParams.append('department', filters.department);

      const res = await axios.get(`${API_BASE_URL}/superadmin/hods?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHods(res.data);
    } catch (err: any) {
      console.error(err);
      if(err.response?.status === 401) { alert("Session expired. Please log in again."); window.location.href = "/"; } else { onSuccess("Failed to fetch HODs", "error"); }
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/superadmin/filters`, { headers: { Authorization: `Bearer ${token}` } });
      setOptions(res.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHods();
    fetchOptions();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/superadmin/users/${editModal.id}`, editModal, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditModal(null);
      onSuccess("HOD updated successfully", "success");
      fetchHods();
    } catch (err: any) {
      onSuccess("Failed to update HOD", "error");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API_BASE_URL}/superadmin/users/${passwordModal.id}/reset-password`, 
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordModal(null);
      setNewPassword("");
      onSuccess("Password reset successfully", "success");
    } catch (err: any) {
      onSuccess("Failed to reset password", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this HOD?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/superadmin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess("HOD deactivated successfully", "success");
      fetchHods();
    } catch (err: any) {
      onSuccess("Failed to deactivate HOD", "error");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-6 md:p-8 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Manage HOD</h2>
          <p className="text-slate-500 text-sm mt-1">View, edit and deactivate Heads of Department.</p>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Department</label>
            <div className="flex gap-4">
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="flex-1 p-3 rounded-lg border border-slate-300 focus:border-[#005EB8] outline-none bg-white text-sm"
              >
                <option value="">All Departments</option>
                {options.departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <button 
                onClick={fetchHods}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#005EB8] text-white rounded-xl font-bold hover:bg-[#004a94] transition-colors"
              >
                <Search size={18} /> Search
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-sm border-b border-slate-200">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Department</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading...</td></tr>
              ) : hods.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No HODs found matching filters.</td></tr>
              ) : (
                hods.map((h) => (
                  <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">{h.full_name}</td>
                    <td className="p-4 text-slate-600 text-sm">{h.email}</td>
                    <td className="p-4 text-slate-600 text-sm">
                      {h.hod_profile?.department}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditModal({
                          id: h.id,
                          full_name: h.full_name,
                          email: h.email,
                          department: h.hod_profile?.department || "",
                        })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setPasswordModal(h)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Reset Password">
                          <KeyRound size={16} />
                        </button>
                        <button onClick={() => handleDelete(h.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Deactivate">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Edit HOD</h3>
              <button onClick={() => setEditModal(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <input type="text" placeholder="Name" value={editModal.full_name} onChange={(e) => setEditModal({...editModal, full_name: e.target.value})} className="p-3 border rounded-lg" required />
              <input type="email" placeholder="Email" value={editModal.email} onChange={(e) => setEditModal({...editModal, email: e.target.value})} className="p-3 border rounded-lg" required />
              
              <select value={editModal.department} onChange={(e) => setEditModal({...editModal, department: e.target.value})} className="p-3 border rounded-lg" required>
                <option value="">Select Department</option>
                {options.departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              
              <button type="submit" className="mt-2 w-full p-3 bg-[#005EB8] text-white rounded-lg font-bold">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Reset Password</h3>
              <button onClick={() => setPasswordModal(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <p className="text-sm text-slate-600 mb-2">Set new password for <strong>{passwordModal.full_name}</strong></p>
              <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="p-3 border rounded-lg" required minLength={6} />
              <button type="submit" className="w-full p-3 bg-amber-600 text-white rounded-lg font-bold">Reset Password</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
