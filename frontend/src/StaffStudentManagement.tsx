import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from './config';
import { User, Search, UserPlus, X, CheckCircle, AlertCircle } from "lucide-react";

interface Batch {
  id: number;
  semester: number;
  section: string;
  status: string;
  course_title: string;
}

interface StudentProgress {
  student_id: number;
  full_name: string;
  email: string;
  completed: number;
  total: number;
  percentage: number;
}

const StaffStudentManagement = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const brand = {
    blue: "#005EB8", textMain: "#1e293b", textLight: "#64748b",
    cardBg: "#F8FAFC", border: "#cbd5e1", green: "#94A3B8"
  };

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollDept, setEnrollDept] = useState("");
  const [enrollSem, setEnrollSem] = useState("");
  const [enrollSec, setEnrollSec] = useState("");
  const [targetCourseId, setTargetCourseId] = useState<number | "">("");
  const [searchStudents, setSearchStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [staffCourses, setStaffCourses] = useState<any[]>([]);

  const triggerToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type: type as "success" | "error" });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    fetchStaffBatches();
  }, []);

  const fetchStaffBatches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/staff/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaffCourses(res.data);
      const allBatches = res.data.flatMap((course: any) => 
        course.batches.map((b: any) => ({ ...b, course_title: course.title }))
      );
      setBatches(allBatches);
      if (allBatches.length > 0) {
        setSelectedBatchId(allBatches[0].id);
      }
      if (res.data.length > 0) {
        setTargetCourseId(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load staff batches", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBatchId) {
      fetchBatchStudents(selectedBatchId);
    }
  }, [selectedBatchId]);

  const fetchBatchStudents = async (batchId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [studentRes, progressRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/staff/batches/${batchId}/students`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/staff/batches/${batchId}/progress`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStudents(studentRes.data.students || []);
      setProgress(progressRes.data.progress || []);
    } catch (err) {
      console.error("Failed to fetch batch students", err);
      setStudents([]);
      setProgress([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (enrollDept) queryParams.append("department", enrollDept);
      if (enrollSem) queryParams.append("semester", enrollSem);
      if (enrollSec) queryParams.append("section", enrollSec);

      const res = await axios.get(`${API_BASE_URL}/staff/students?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchStudents(res.data);
    } catch (err) {
      triggerToast("Failed to fetch students.", "error");
    }
  };

  const handleBulkEnroll = async () => {
    if (!targetCourseId) return triggerToast("Please select a target course", "error");
    if (selectedStudentIds.length === 0) return triggerToast("No students selected", "error");

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/staff/courses/${targetCourseId}/enroll`, 
        { student_ids: selectedStudentIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      triggerToast("Students successfully enrolled!", "success");
      setShowEnrollModal(false);
      setSelectedStudentIds([]);
      if (selectedBatchId) fetchBatchStudents(selectedBatchId); // Refresh table
    } catch (err) {
      triggerToast("Bulk enrollment failed.", "error");
    }
  };

  const toggleStudentSelection = (id: number) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const selectAllStudents = () => {
    if (selectedStudentIds.length === searchStudents.length) setSelectedStudentIds([]);
    else setSelectedStudentIds(searchStudents.map(s => s.id));
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 bg-white p-4 rounded-xl shadow-2xl border-l-4 flex items-center gap-3 animate-slide-in ${toast.type === "success" ? "border-green-500" : "border-red-500"}`}>
          {toast.type === "success" ? <CheckCircle size={24} className="text-green-500" /> : <AlertCircle size={24} className="text-red-500" />}
          <div>
            <h4 className="font-bold text-[#1e293b] text-sm mb-0.5">{toast.type === "success" ? "Success" : "Error"}</h4>
            <p className="text-xs text-slate-500 m-0">{toast.message}</p>
          </div>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"><X size={16} /></button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: brand.textMain, margin: 0 }}>My Students</h1>
          <p style={{ color: brand.textLight, marginTop: "5px" }}>Manage students enrolled in your specific course sections.</p>
        </div>

        <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "600px", flexDirection: "row", alignItems: "center" }}>
          <button onClick={() => { setShowEnrollModal(true); handleSearchStudents(); }} className="flex items-center gap-2 px-4 py-2 bg-[#005EB8] text-white rounded-lg font-bold hover:bg-blue-700 transition-colors whitespace-nowrap border-none cursor-pointer">
            <UserPlus size={18} /> Bulk Enroll
          </button>
          <select
            value={selectedBatchId || ""}
            onChange={(e) => setSelectedBatchId(Number(e.target.value))}
            style={{ padding: "10px", borderRadius: "10px", border: `1px solid ${brand.border}`, outline: "none", fontSize: "14px", flex: 1 }}
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.course_title} (Sem {b.semester} - Sec {b.section})
              </option>
            ))}
          </select>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "12px", color: brand.textLight }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: "10px", border: `1px solid ${brand.border}`, outline: "none", fontSize: "14px" }}
            />
          </div>
        </div>
      </div>

      <div style={{ background: brand.cardBg, borderRadius: "16px", border: `1px solid ${brand.border}`, overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
        <div className="overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "800px" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${brand.border}`, color: brand.textLight, fontSize: "12px", textTransform: "uppercase" }}>
                <th style={{ padding: "20px", fontWeight: "700" }}>Student Name</th>
                <th style={{ padding: "20px", fontWeight: "700" }}>Enrollment Info</th>
                <th style={{ padding: "20px", fontWeight: "700" }}>Progress</th>
                <th style={{ padding: "20px", fontWeight: "700", textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: brand.textLight }}>Loading data...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: brand.textLight }}>No students found in this batch.</td></tr>
              ) : (
                filteredStudents.map(({ enrollment_id, student }) => {
                  const p = progress.find(pr => pr.student_id === student.id);
                  return (
                    <tr key={enrollment_id} style={{ borderBottom: `1px solid ${brand.border}`, background: "white" }}>
                      <td style={{ padding: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#e0f2fe", color: brand.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <User size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", color: brand.textMain }}>{student.full_name}</div>
                            <div style={{ fontSize: "12px", color: brand.textLight }}>{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "20px", color: brand.textLight, fontSize: "13px" }}>
                        <div>Year: <strong>{student.profile?.enrollment_year || 'N/A'}</strong></div>
                        <div>Branch: <strong>{student.profile?.branch || 'N/A'}</strong></div>
                      </td>
                      <td style={{ padding: "20px" }}>
                        {p ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "100%", background: brand.border, height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                              <div style={{ width: `${p.percentage}%`, height: "100%", background: p.percentage === 100 ? brand.green : brand.blue }} />
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: "bold", color: brand.textMain }}>{p.percentage}%</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: brand.textLight }}>No data</span>
                        )}
                      </td>
                      <td style={{ padding: "20px", textAlign: "center" }}>
                        {student.is_active ? 
                          <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>Active</span> : 
                          <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>Inactive</span>
                        }
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BULK ENROLL MODAL */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800"><UserPlus size={24} className="text-[#005EB8]" /> Bulk Enroll Students</h2>
              <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"><X size={24} /></button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                  <select value={enrollDept} onChange={(e) => setEnrollDept(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#005EB8] outline-none">
                    <option value="">All</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Semester</label>
                  <select value={enrollSem} onChange={(e) => setEnrollSem(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#005EB8] outline-none">
                    <option value="">All</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Section</label>
                  <input type="text" placeholder="e.g. A" value={enrollSec} onChange={(e) => setEnrollSec(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#005EB8] outline-none" />
                </div>
                <div className="flex items-end">
                  <button onClick={handleSearchStudents} className="w-full bg-slate-800 text-white p-2.5 rounded-lg font-bold border-none hover:bg-slate-900 transition-colors cursor-pointer">Find</button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Course</label>
                <select value={targetCourseId} onChange={(e) => setTargetCourseId(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#005EB8] outline-none bg-blue-50/30">
                  <option value="">-- Select Course --</option>
                  {staffCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div className="border border-slate-200 rounded-xl max-h-[300px] overflow-y-auto bg-slate-50">
                <div className="flex justify-between items-center p-3 border-b border-slate-200 bg-white sticky top-0">
                  <span className="text-sm font-bold text-slate-600">Found {searchStudents.length} Students</span>
                  {searchStudents.length > 0 && <button onClick={selectAllStudents} className="text-xs font-bold text-[#005EB8] border-none bg-transparent cursor-pointer">{selectedStudentIds.length === searchStudents.length ? "Deselect All" : "Select All"}</button>}
                </div>
                <div className="p-2">
                  {searchStudents.length === 0 ? (
                    <div className="text-center p-6 text-slate-400 text-sm">Use the filters above to find students.</div>
                  ) : (
                    searchStudents.map(student => (
                      <div key={student.id} onClick={() => toggleStudentSelection(student.id)} className={`p-3 mb-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors border ${selectedStudentIds.includes(student.id) ? "bg-blue-50 border-blue-200" : "bg-white border-slate-100 hover:border-slate-300"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedStudentIds.includes(student.id) ? "bg-[#005EB8] border-[#005EB8]" : "bg-white border-slate-300"}`}>
                            {selectedStudentIds.includes(student.id) && <CheckCircle size={14} color="white" />}
                          </div>
                          <div>
                            <div className={`text-sm font-bold ${selectedStudentIds.includes(student.id) ? "text-[#005EB8]" : "text-slate-700"}`}>{student.full_name}</div>
                            <div className="text-xs text-slate-500">{student.email}</div>
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          {student.student_profile?.branch} - Sem {student.student_profile?.current_semester}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button onClick={() => setShowEnrollModal(false)} className="px-6 py-2 rounded-lg border border-slate-300 bg-white text-slate-600 font-bold hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={handleBulkEnroll} className="px-6 py-2 rounded-lg border-none bg-[#005EB8] text-white font-bold shadow-md hover:bg-blue-700 cursor-pointer disabled:opacity-50" disabled={selectedStudentIds.length === 0 || !targetCourseId}>Enroll {selectedStudentIds.length} Students</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default StaffStudentManagement;
