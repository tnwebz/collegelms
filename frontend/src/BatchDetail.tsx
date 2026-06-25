import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "./config";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  X,
  Search,
  Trash2,
  KeyRound,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Mail,
  GraduationCap,
  AlertTriangle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Brand colours                                                      */
/* ------------------------------------------------------------------ */
const brand = {
  blue: "#005EB8",
  blueDark: "#004e9a",
  textMain: "#1e293b",
  textLight: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
  green: "#10b981",
  red: "#ef4444",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface StudentRow {
  enrollment_id: number;
  enrollment_date: string;
  student: {
    id: number;
    full_name: string;
    email: string;
    phone_number: string | null;
    is_active: boolean;
    profile: {
      enrollment_year: number | null;
      current_semester: number | null;
      branch: string | null;
    } | null;
  } | null;
}

interface ReportRow {
  student_id: number;
  full_name: string;
  email: string;
  department: string;
  semester: number;
  section: string;
  enrollment_year: number | null;
  total_submissions: number;
  verified_submissions: number;
  content_completed: number;
  content_total: number;
  completion_percentage: number;
}

interface BatchInfo {
  id: number;
  semester: number;
  section: string;
  year: number;
  status: string;
  course_title: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const BatchDetail = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"onboarding" | "students" | "reports">("onboarding");

  // Batch info
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  /* ===== ONBOARDING STATE ===== */
  const [singleName, setSingleName] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filter & Enroll
  const [filterDept, setFilterDept] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [filterSec, setFilterSec] = useState("");
  const [filterStudents, setFilterStudents] = useState<any[]>([]);
  const [filterSelectedIds, setFilterSelectedIds] = useState<number[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);

  /* ===== STUDENT MANAGEMENT STATE ===== */
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [smFilterDept, setSmFilterDept] = useState("");
  const [smFilterSem, setSmFilterSem] = useState("");
  const [smFilterSec, setSmFilterSec] = useState("");
  const [smFilterYear, setSmFilterYear] = useState("");
  const [resetPasswordModal, setResetPasswordModal] = useState<{ id: number; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  /* ===== REPORTS STATE ===== */
  const [report, setReport] = useState<ReportRow[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  /* ===== EFFECTS ===== */
  useEffect(() => {
    fetchBatchInfo();
  }, [batchId]);

  useEffect(() => {
    if (activeTab === "students") fetchStudents();
    if (activeTab === "reports") fetchReport();
  }, [activeTab]);

  /* ===== DATA FETCHING ===== */
  const token = () => localStorage.getItem("token");

  const fetchBatchInfo = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/staff/batches/${batchId}/students`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setBatchInfo(res.data.batch);
      setStudents(res.data.students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/staff/batches/${batchId}/students`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setStudents(res.data.students);
      setBatchInfo(res.data.batch);
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/staff/batches/${batchId}/report`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setReport(res.data.report);
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  /* ===== ONBOARDING HANDLERS ===== */
  const handleSingleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleLoading(true);
    const generatedPassword = Math.random().toString(36).slice(-8) + "1!";
    try {
      await axios.post(
        `${API_BASE_URL}/admin/admit-student`,
        { full_name: singleName, email: singleEmail, batch_ids: [Number(batchId)], password: generatedPassword },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      triggerToast(`Account created & email sent to ${singleEmail}`, "success");
      setSingleName("");
      setSingleEmail("");
      fetchBatchInfo();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || "Failed", "error");
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBulkAdmit = async () => {
    if (!bulkFile) return triggerToast("Select a file first", "error");
    setBulkLoading(true);
    const formData = new FormData();
    formData.append("file", bulkFile);
    formData.append("batch_id", String(batchId));
    try {
      await axios.post(`${API_BASE_URL}/admin/bulk-admit`, formData, {
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "multipart/form-data" },
      });
      triggerToast("Bulk process complete!", "success");
      setBulkFile(null);
      fetchBatchInfo();
    } catch {
      triggerToast("Upload failed", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email\nJohn Doe,john@college.edu";
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "student_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilterSearch = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterDept) queryParams.append("department", filterDept);
      if (filterSem) queryParams.append("semester", filterSem);
      if (filterSec) queryParams.append("section", filterSec);
      const res = await axios.get(`${API_BASE_URL}/staff/students?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setFilterStudents(res.data);
      setFilterSelectedIds([]);
    } catch {
      triggerToast("Failed to fetch students", "error");
    }
  };

  const handleFilterEnroll = async () => {
    if (filterSelectedIds.length === 0) return triggerToast("Select students first", "error");
    setFilterLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/batches/${batchId}/enroll-existing`,
        { student_ids: filterSelectedIds },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      triggerToast(res.data.message || "Students enrolled!", "success");
      setFilterSelectedIds([]);
      setFilterStudents([]);
      fetchBatchInfo();
    } catch {
      triggerToast("Enrollment failed", "error");
    } finally {
      setFilterLoading(false);
    }
  };

  /* ===== STUDENT MANAGEMENT HANDLERS ===== */
  const handleRemoveStudent = async (studentId: number) => {
    if (!window.confirm("Remove this student from the batch?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/staff/batches/${batchId}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      triggerToast("Student removed", "success");
      fetchStudents();
      setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
    } catch {
      triggerToast("Failed to remove student", "error");
    }
  };

  const handleBulkRemove = async () => {
    if (selectedStudentIds.length === 0) return;
    if (!window.confirm(`Remove ${selectedStudentIds.length} students from this batch?`)) return;
    try {
      await Promise.all(
        selectedStudentIds.map((sid) =>
          axios.delete(`${API_BASE_URL}/staff/batches/${batchId}/students/${sid}`, {
            headers: { Authorization: `Bearer ${token()}` },
          })
        )
      );
      triggerToast(`Removed ${selectedStudentIds.length} students`, "success");
      setSelectedStudentIds([]);
      fetchStudents();
    } catch {
      triggerToast("Failed to remove some students", "error");
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordModal || !newPassword) return;
    setResetLoading(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/admin/students/${resetPasswordModal.id}/reset-password`,
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      triggerToast("Password reset successfully", "success");
      setResetPasswordModal(null);
      setNewPassword("");
    } catch {
      triggerToast("Failed to reset password", "error");
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteBatch = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/staff/batches/${batchId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      triggerToast("Batch deleted", "success");
      setTimeout(() => navigate("/dashboard/batches"), 500);
    } catch {
      triggerToast("Failed to delete batch", "error");
    }
  };

  /* ===== REPORTS HANDLERS ===== */
  const handleExportExcel = () => {
    if (report.length === 0) return triggerToast("No data to export", "error");
    const data = report.map((r) => ({
      "Student Name": r.full_name,
      "Email": r.email,
      "Department": r.department,
      "Semester": r.semester,
      "Section": r.section,
      "Total Submissions": r.total_submissions,
      "Verified Submissions": r.verified_submissions,
      "Content Completed": r.content_completed,
      "Content Total": r.content_total,
      "Completion %": r.completion_percentage,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `Batch_${batchId}_Report.xlsx`);
    triggerToast("Excel exported!", "success");
  };

  /* ===== FILTERED STUDENTS (for Student Management tab) ===== */
  const filteredStudents = students.filter((s) => {
    if (!s.student) return false;
    const p = s.student.profile;
    if (smFilterDept && p?.branch !== smFilterDept) return false;
    if (smFilterSem && String(p?.current_semester) !== smFilterSem) return false;
    if (smFilterSec && String(p?.branch)?.toLowerCase().includes("section") === false) {
      // section filter: We match against enrolled batch section or profile-level data
    }
    if (smFilterYear && String(p?.enrollment_year) !== smFilterYear) return false;
    return true;
  });

  const toggleSelectAll = () => {
    const allIds = filteredStudents.filter((s) => s.student).map((s) => s.student!.id);
    if (selectedStudentIds.length === allIds.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(allIds);
    }
  };

  /* ===== LOADING ===== */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-500 text-lg">Loading batch details...</div>
      </div>
    );
  }

  /* ===== RENDER ===== */
  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 md:px-10 py-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard/batches")}
            className="bg-slate-100 border-none p-2.5 rounded-full cursor-pointer hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={20} color={brand.textMain} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 m-0">
              {batchInfo?.course_title || "Batch Detail"}
            </h1>
            <p className="text-sm text-slate-500 m-0 mt-1">
              Sem {batchInfo?.semester} — Sec {batchInfo?.section}{" "}
              {batchInfo?.year && `(${batchInfo.year})`}
              <span
                className="ml-3 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase"
              >
                {batchInfo?.status}
              </span>
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 mt-5 -mb-5">
          {(
            [
              { key: "onboarding", label: "Onboarding", icon: <UserPlus size={16} /> },
              { key: "students", label: "Student Management", icon: <Users size={16} /> },
              { key: "reports", label: "Reports & Data", icon: <BarChart3 size={16} /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer bg-transparent ${
                activeTab === tab.key
                  ? "border-[#005EB8] text-[#005EB8]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="p-6 md:p-10">
        {/* ==================== TAB 1: ONBOARDING ==================== */}
        {activeTab === "onboarding" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
            {/* LEFT — FILTER & ENROLL (Larger) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <div className="border-b border-slate-100 pb-5 mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                  <Users size={22} className="text-[#005EB8]" /> Filter & Enroll Existing Students
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  Search students by department, semester, and section, then enroll them into this batch.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-300 text-sm focus:border-[#005EB8] outline-none bg-white"
                  >
                    <option value="">All Departments</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Semester</label>
                  <select
                    value={filterSem}
                    onChange={(e) => setFilterSem(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-300 text-sm focus:border-[#005EB8] outline-none bg-white"
                  >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Section</label>
                  <input
                    type="text"
                    placeholder="e.g. A"
                    value={filterSec}
                    onChange={(e) => setFilterSec(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-300 text-sm focus:border-[#005EB8] outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleFilterSearch}
                className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold border-none hover:bg-slate-900 transition-colors cursor-pointer flex items-center gap-2 mb-5"
              >
                <Search size={16} /> Find Students
              </button>

              {/* Results table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <div className="flex justify-between items-center p-3 border-b border-slate-200 bg-white">
                  <span className="text-xs font-bold text-slate-600">Found: {filterStudents.length} students</span>
                  {filterStudents.length > 0 && (
                    <button
                      onClick={() => {
                        if (filterSelectedIds.length === filterStudents.length) setFilterSelectedIds([]);
                        else setFilterSelectedIds(filterStudents.map((s: any) => s.id));
                      }}
                      className="text-xs font-bold text-[#005EB8] border-none bg-transparent cursor-pointer hover:underline"
                    >
                      {filterSelectedIds.length === filterStudents.length ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto p-3">
                  {filterStudents.length === 0 ? (
                    <div className="text-center p-8 text-sm text-slate-400">
                      Use the filters above to search for students
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {filterStudents.map((student: any) => (
                        <div
                          key={student.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors bg-slate-50/50"
                        >
                          <input
                            type="checkbox"
                            checked={filterSelectedIds.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) setFilterSelectedIds([...filterSelectedIds, student.id]);
                              else setFilterSelectedIds(filterSelectedIds.filter((id) => id !== student.id));
                            }}
                            className="w-4 h-4 rounded border-slate-300 accent-[#005EB8]"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700 truncate">{student.full_name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {student.student_profile?.branch} · Sem {student.student_profile?.current_semester} · Sec{" "}
                              {student.student_profile?.section}
                            </p>
                          </div>
                          <span className="text-xs text-slate-400 truncate">{student.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                disabled={filterLoading || filterSelectedIds.length === 0}
                onClick={handleFilterEnroll}
                className="w-full mt-5 py-4 bg-[#005EB8] text-white rounded-xl font-bold text-sm hover:bg-[#004e9a] transition-all shadow-md shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {filterLoading ? "Enrolling..." : `Enroll ${filterSelectedIds.length} Students`}
              </button>
            </div>

            {/* RIGHT — Single + Bulk (Smaller) */}
            <div className="flex flex-col gap-6">
              {/* Single Admit */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-4 mb-5">
                  <h3 className="text-base font-bold flex items-center gap-2 text-slate-800">
                    <UserPlus size={18} className="text-[#005EB8]" /> Single Student Admit
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">Create an account & assign to this batch.</p>
                </div>
                <form onSubmit={handleSingleAdmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      required
                      value={singleName}
                      onChange={(e) => setSingleName(e.target.value)}
                      placeholder="Student Name"
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#005EB8] focus:ring-1 focus:ring-[#005EB8] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      required
                      type="email"
                      value={singleEmail}
                      onChange={(e) => setSingleEmail(e.target.value)}
                      placeholder="student@college.edu"
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#005EB8] focus:ring-1 focus:ring-[#005EB8] outline-none transition-all"
                    />
                  </div>
                  <button
                    disabled={singleLoading}
                    type="submit"
                    className="w-full py-3 bg-[#005EB8] text-white rounded-xl font-bold text-sm hover:bg-[#004e9a] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {singleLoading ? "Processing..." : "Create & Send Email"}
                  </button>
                </form>
              </div>

              {/* Bulk Upload */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-4 mb-5 flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2 text-slate-800">
                      <FileSpreadsheet size={18} className="text-slate-400" /> Bulk Upload
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">Upload Excel to onboard a whole batch.</p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="text-xs font-bold text-[#005EB8] flex items-center gap-1 hover:underline bg-transparent border-none cursor-pointer"
                  >
                    <Download size={14} /> Template
                  </button>
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center min-h-[120px] bg-slate-50 relative hover:bg-slate-100 transition-colors group mb-4">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => setBulkFile(e.target.files ? e.target.files[0] : null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {bulkFile ? (
                    <div className="text-center py-3">
                      <FileSpreadsheet size={32} className="text-slate-400 mx-auto mb-1" />
                      <div className="font-bold text-sm text-slate-700">{bulkFile.name}</div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <Upload size={24} className="text-slate-400 mx-auto mb-1" />
                      <div className="text-sm font-bold text-slate-600">Drop Excel Here</div>
                      <div className="text-xs text-slate-400">or click to browse</div>
                    </div>
                  )}
                </div>
                <button
                  disabled={bulkLoading}
                  onClick={handleBulkAdmit}
                  className="w-full py-3 bg-slate-600 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {bulkLoading ? "Processing..." : "Process Batch Upload"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: STUDENT MANAGEMENT ==================== */}
        {activeTab === "students" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Filters Bar */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Year</label>
                  <select
                    value={smFilterYear}
                    onChange={(e) => setSmFilterYear(e.target.value)}
                    className="p-2 rounded-lg border border-slate-300 text-sm outline-none bg-white min-w-[100px]"
                  >
                    <option value="">All</option>
                    {[2022, 2023, 2024, 2025, 2026].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                  <select
                    value={smFilterDept}
                    onChange={(e) => setSmFilterDept(e.target.value)}
                    className="p-2 rounded-lg border border-slate-300 text-sm outline-none bg-white min-w-[160px]"
                  >
                    <option value="">All</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Semester</label>
                  <select
                    value={smFilterSem}
                    onChange={(e) => setSmFilterSem(e.target.value)}
                    className="p-2 rounded-lg border border-slate-300 text-sm outline-none bg-white min-w-[100px]"
                  >
                    <option value="">All</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Section</label>
                  <input
                    type="text"
                    placeholder="e.g. A"
                    value={smFilterSec}
                    onChange={(e) => setSmFilterSec(e.target.value)}
                    className="p-2 rounded-lg border border-slate-300 text-sm outline-none min-w-[80px]"
                  />
                </div>
                {selectedStudentIds.length > 0 && (
                  <button
                    onClick={handleBulkRemove}
                    className="ml-auto bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Remove {selectedStudentIds.length} Selected
                  </button>
                )}
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left p-3 w-10">
                      <input
                        type="checkbox"
                        checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.filter((s) => s.student).length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 accent-[#005EB8]"
                      />
                    </th>
                    <th className="text-left p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Department</th>
                    <th className="text-left p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Sem</th>
                    <th className="text-left p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                    <th className="text-left p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center p-10 text-slate-400">Loading...</td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-10 text-slate-400">No students found</td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) =>
                      s.student ? (
                        <tr key={s.student.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(s.student.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, s.student!.id]);
                                else setSelectedStudentIds(selectedStudentIds.filter((id) => id !== s.student!.id));
                              }}
                              className="w-4 h-4 rounded border-slate-300 accent-[#005EB8]"
                            />
                          </td>
                          <td className="p-3 font-semibold text-slate-800">{s.student.full_name}</td>
                          <td className="p-3 text-slate-500">{s.student.email}</td>
                          <td className="p-3 text-slate-600">{s.student.profile?.branch || "N/A"}</td>
                          <td className="p-3 text-slate-600">{s.student.profile?.current_semester || "N/A"}</td>
                          <td className="p-3 text-slate-600">{s.student.profile?.enrollment_year || "N/A"}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setResetPasswordModal({ id: s.student!.id, name: s.student!.full_name || "" })}
                                className="bg-amber-50 text-amber-600 border border-amber-200 p-1.5 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
                                title="Reset Password"
                              >
                                <KeyRound size={14} />
                              </button>
                              <button
                                onClick={() => handleRemoveStudent(s.student!.id)}
                                className="bg-red-50 text-red-500 border border-red-200 p-1.5 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                                title="Remove from Batch"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : null
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Showing {filteredStudents.length} of {students.length} enrolled students
              </span>
            </div>

            {/* DANGER ZONE: Delete Batch */}
            <div className="m-6 p-5 border-2 border-dashed border-red-200 rounded-xl bg-red-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-red-700 flex items-center gap-2">
                    <AlertTriangle size={16} /> Danger Zone
                  </h4>
                  <p className="text-xs text-red-500 mt-1">
                    Deleting this batch will permanently remove all enrollments. This cannot be undone.
                  </p>
                </div>
                {deleteConfirm ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteBatch}
                      className="px-4 py-2 text-sm font-bold text-white bg-red-600 border-none rounded-lg cursor-pointer hover:bg-red-700"
                    >
                      Yes, Delete Batch
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="px-4 py-2 text-sm font-bold text-red-600 bg-white border border-red-300 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                  >
                    Delete Batch
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: REPORTS & DATA ==================== */}
        {activeTab === "reports" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Report Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 size={20} className="text-[#005EB8]" /> Student Performance Report
                </h3>
                <p className="text-xs text-slate-500 mt-1">{report.length} students · {batchInfo?.course_title}</p>
              </div>
              <button
                onClick={handleExportExcel}
                className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-green-700 transition-colors cursor-pointer border-none"
              >
                <Download size={16} /> Export Excel
              </button>
            </div>

            {/* Report Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Dept</th>
                    <th className="text-center p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Submissions</th>
                    <th className="text-center p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Verified</th>
                    <th className="text-center p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {reportLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center p-10 text-slate-400">Loading report...</td>
                    </tr>
                  ) : report.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-10 text-slate-400">
                        No student data available
                      </td>
                    </tr>
                  ) : (
                    report.map((r) => (
                      <tr key={r.student_id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-800">{r.full_name}</td>
                        <td className="p-3 text-slate-500">{r.email}</td>
                        <td className="p-3 text-slate-600">{r.department}</td>
                        <td className="p-3 text-center">
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">
                            {r.total_submissions}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">
                            {r.verified_submissions}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3 justify-center">
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${r.completion_percentage}%`,
                                  background:
                                    r.completion_percentage >= 80
                                      ? brand.green
                                      : r.completion_percentage >= 40
                                      ? "#f59e0b"
                                      : brand.red,
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-600 min-w-[35px]">
                              {r.completion_percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ==================== RESET PASSWORD MODAL ==================== */}
      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <KeyRound size={20} className="text-amber-500" /> Reset Password
              </h2>
              <button
                onClick={() => {
                  setResetPasswordModal(null);
                  setNewPassword("");
                }}
                className="bg-transparent border-none cursor-pointer"
              >
                <X className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Set a new password for <strong>{resetPasswordModal.name}</strong>
            </p>
            <input
              type="text"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg mb-4 outline-none focus:border-[#005EB8]"
            />
            <button
              disabled={resetLoading || !newPassword}
              onClick={handleResetPassword}
              className="w-full py-3 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
            >
              {resetLoading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </div>
      )}

      {/* ==================== TOAST ==================== */}
      {toast.show && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "white",
            padding: "16px 24px",
            borderRadius: "12px",
            boxShadow: "0 10px 30px -5px rgba(0,0,0,0.15)",
            borderLeft: `6px solid ${toast.type === "success" ? brand.green : brand.red}`,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            zIndex: 9999,
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle size={24} color={brand.green} />
          ) : (
            <AlertCircle size={24} color={brand.red} />
          )}
          <div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: brand.textMain }}>
              {toast.type === "success" ? "Success" : "Error"}
            </h4>
            <p style={{ margin: 0, fontSize: "13px", color: brand.textLight }}>{toast.message}</p>
          </div>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "10px" }}
          >
            <X size={16} color="#94a3b8" />
          </button>
        </div>
      )}
    </div>
  );
};

export default BatchDetail;
