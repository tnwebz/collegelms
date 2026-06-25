import { useState, useEffect } from "react";
import axios from "axios";
import { Search, Edit2, Trash2, KeyRound, X } from "lucide-react";
import API_BASE_URL from './config';


const SECTIONS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");


export const ManageStudents = ({ onSuccess }: { onSuccess: (msg: string, type: "success" | "error") => void }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ batch_year: "", department: "", section: "", semester: "" });
  const [options, setOptions] = useState({ batchYears: [] as string[], semesters: [] as number[], departments: [] as string[], sections: [] as string[] });
  
  const [editModal, setEditModal] = useState<any>(null);
  const [passwordModal, setPasswordModal] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (filters.batch_year) queryParams.append('batch_year', filters.batch_year);
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.section) queryParams.append('section', filters.section);
      if (filters.semester) queryParams.append('semester', filters.semester);

      const res = await axios.get(`${API_BASE_URL}/superadmin/students?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
    } catch (err: any) {
      console.error(err);
      if(err.response?.status === 401) { alert("Session expired. Please log in again."); window.location.href = "/"; } else { onSuccess("Failed to fetch students", "error"); }
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
    fetchStudents();
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
      onSuccess("Student updated successfully", "success");
      fetchStudents();
    } catch (err: any) {
      onSuccess("Failed to update student", "error");
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
    if (!confirm("Are you sure you want to deactivate this student?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/superadmin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess("Student deactivated successfully", "success");
      fetchStudents();
    } catch (err: any) {
      onSuccess("Failed to deactivate student", "error");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-6 md:p-8 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Manage Students</h2>
          <p className="text-slate-500 text-sm mt-1">View, edit and deactivate students.</p>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Academic Year</label>
            <select
              value={filters.batch_year}
              onChange={(e) => setFilters({ ...filters, batch_year: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-300 focus:border-[#005EB8] outline-none bg-white text-sm"
            >
              <option value="">All Years</option>
              {options.batchYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Semester</label>
            <select
              value={filters.semester}
              onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-300 focus:border-[#005EB8] outline-none bg-white text-sm"
            >
              <option value="">All Semesters</option>
              {options.semesters.map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-300 focus:border-[#005EB8] outline-none bg-white text-sm"
            >
              <option value="">All Departments</option>
              {options.departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Section</label>
            <select
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-300 focus:border-[#005EB8] outline-none bg-white text-sm"
            >
              <option value="">All Sections</option>
              {options.sections.map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end mb-6">
          <button 
            onClick={fetchStudents}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#005EB8] text-white rounded-xl font-bold hover:bg-[#004a94] transition-colors"
          >
            <Search size={18} /> Search
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-sm border-b border-slate-200">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Dept / Sec</th>
                <th className="p-4 font-semibold">Year / Sem</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No students found matching filters.</td></tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">{student.full_name}</td>
                    <td className="p-4 text-slate-600 text-sm">{student.email}</td>
                    <td className="p-4 text-slate-600 text-sm">
                      {student.student_profile?.branch} - {student.student_profile?.section}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {student.student_profile?.batch_year} (Sem {student.student_profile?.semester})
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditModal({
                          id: student.id,
                          full_name: student.full_name,
                          email: student.email,
                          department: student.student_profile?.branch || "",
                          batch_year: student.student_profile?.batch_year || "",
                          semester: student.student_profile?.semester || "",
                          section: student.student_profile?.section || "",
                        })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setPasswordModal(student)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Reset Password">
                          <KeyRound size={16} />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Deactivate">
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
              <h3 className="text-lg font-bold">Edit Student</h3>
              <button onClick={() => setEditModal(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <input type="text" placeholder="Name" value={editModal.full_name} onChange={(e) => setEditModal({...editModal, full_name: e.target.value})} className="p-3 border rounded-lg" required />
              <input type="email" placeholder="Email" value={editModal.email} onChange={(e) => setEditModal({...editModal, email: e.target.value})} className="p-3 border rounded-lg" required />
              
              <select value={editModal.department} onChange={(e) => setEditModal({...editModal, department: e.target.value})} className="p-3 border rounded-lg" required>
                <option value="">Select Department</option>
                {options.departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              
              <select value={editModal.batch_year} onChange={(e) => setEditModal({...editModal, batch_year: e.target.value})} className="p-3 border rounded-lg" required>
                <option value="">Select Year</option>
                {options.batchYears.map(yr => <option key={yr} value={yr}>{yr}</option>)}
              </select>

              <select value={editModal.semester} onChange={(e) => setEditModal({...editModal, semester: e.target.value})} className="p-3 border rounded-lg" required>
                <option value="">Select Semester</option>
                {options.semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
              
              <select value={editModal.section} onChange={(e) => setEditModal({...editModal, section: e.target.value})} className="p-3 border rounded-lg" required>
                <option value="">Select Section</option>
                {options.sections.map(s => <option key={s} value={s}>Section {s}</option>)}
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
