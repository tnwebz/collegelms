import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LogOut, Shield, Users, GraduationCap, Briefcase, UserPlus,
  ChevronDown, CheckCircle, AlertCircle, X, Download, Upload,
  BookOpen, BarChart3, Settings
} from "lucide-react";
import API_BASE_URL from './config';
import BrandLogo from "./components/BrandLogo";
import { ManageStudents } from "./ManageStudents";
import { ManageStaff } from "./ManageStaff";
import { ManageHod } from "./ManageHod";
import AccountSettings from "./AccountSettings";

// ─── CONSTANTS ──────────────────────────────────────────────────
const DEPARTMENTS = ["CSE", "IT", "AIDS", "AIML", "ECE", "EEE", "Mechatronics"];
const SECTIONS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const currentYear = new Date().getFullYear();
const BATCH_YEARS = Array.from({ length: 6 }, (_, i) => `${currentYear - 2 + i}-${currentYear + 2 + i}`);

// ─── TOAST COMPONENT ────────────────────────────────────────────
const Toast = ({ toast, onClose }: { toast: { show: boolean; message: string; type: "success" | "error" }; onClose: () => void }) => {
  if (!toast.show) return null;
  return (
    <div className="fixed top-5 right-5 z-[9999] bg-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3"
      style={{ borderLeft: `5px solid ${toast.type === "success" ? "#059669" : "#ef4444"}`, animation: "slideIn 0.3s ease-out" }}>
      {toast.type === "success" ? <CheckCircle size={22} className="text-emerald-600" /> : <AlertCircle size={22} className="text-red-500" />}
      <div>
        <h4 className="text-sm font-bold text-slate-800 m-0">{toast.type === "success" ? "Success" : "Error"}</h4>
        <p className="text-xs text-slate-500 m-0 mt-0.5">{toast.message}</p>
      </div>
      <button onClick={onClose} className="ml-3 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"><X size={16} /></button>
    </div>
  );
};

// ─── ONBOARD HOD TAB ────────────────────────────────────────────
const OnboardHod = ({ onSuccess }: { onSuccess: (msg: string) => void }) => {
  const [form, setForm] = useState({ full_name: "", age: "", gender: "", login_id: "", password: "", department: "" });
  const [loading, setLoading] = useState(false);
  const [hodList, setHodList] = useState<any[]>([]);

  useEffect(() => { fetchHods(); }, []);
  const fetchHods = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/superadmin/hods`, { headers: { Authorization: `Bearer ${token}` } });
      setHodList(res.data);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/superadmin/onboard-hod`, form, { headers: { Authorization: `Bearer ${token}` } });
      onSuccess(`HOD "${form.full_name}" created successfully!`);
      setForm({ full_name: "", age: "", gender: "", login_id: "", password: "", department: "" });
      fetchHods();
    } catch (err: any) {
      onSuccess(`Error: ${err.response?.data?.detail || "Failed to create HOD"}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      {/* FORM */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100"><Shield size={22} className="text-amber-700" /></div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 m-0">Onboard New HOD</h3>
            <p className="text-xs text-slate-500 m-0">Create a Head of Department account with department assignment.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField label="Full Name" value={form.full_name} onChange={(v: string) => setForm({ ...form, full_name: v })} placeholder="Dr. John Doe" required />
          <InputField label="Age" value={form.age} onChange={(v: string) => setForm({ ...form, age: v })} placeholder="45" type="number" />
          <SelectField label="Gender" value={form.gender} onChange={(v: string) => setForm({ ...form, gender: v })} options={["Male", "Female", "Other"]} placeholder="Select gender" />
          <SelectField label="Department" value={form.department} onChange={(v: string) => setForm({ ...form, department: v })} options={DEPARTMENTS} placeholder="Select department" required />
          <InputField label="Login ID (Email)" value={form.login_id} onChange={(v: string) => setForm({ ...form, login_id: v })} placeholder="hod.cse@college.edu" required />
          <InputField label="Password" value={form.password} onChange={(v: string) => setForm({ ...form, password: v })} placeholder="••••••••" type="password" required />

          <div className="md:col-span-2 flex justify-end pt-2">
            <button type="submit" disabled={loading}
              className="px-8 py-3.5 bg-[#005EB8] hover:bg-[#004a94] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200/50 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2 border-none cursor-pointer">
              {loading ? "Creating..." : "Create HOD Account"} <UserPlus size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* LIST */}
      {hodList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)]">
          <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4">Existing HODs ({hodList.length})</h3>
          <div className="space-y-3">
            {hodList.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-extrabold text-sm">{h.full_name?.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 m-0">{h.full_name}</p>
                    <p className="text-[11px] text-slate-500 m-0">{h.email} • {h.hod_profile?.department || "N/A"}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 uppercase tracking-wide">HOD</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ONBOARD STAFF TAB ──────────────────────────────────────────
const OnboardStaff = ({ onSuccess }: { onSuccess: (msg: string) => void }) => {
  const [form, setForm] = useState({ full_name: "", age: "", gender: "", login_id: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => { fetchStaff(); }, []);
  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/superadmin/staff`, { headers: { Authorization: `Bearer ${token}` } });
      setStaffList(res.data);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/superadmin/onboard-staff`, form, { headers: { Authorization: `Bearer ${token}` } });
      onSuccess(`Staff "${form.full_name}" created successfully!`);
      setForm({ full_name: "", age: "", gender: "", login_id: "", password: "" });
      fetchStaff();
    } catch (err: any) {
      onSuccess(`Error: ${err.response?.data?.detail || "Failed to create staff"}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100"><Briefcase size={22} className="text-blue-600" /></div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 m-0">Onboard New Staff</h3>
            <p className="text-xs text-slate-500 m-0">Create a staff/faculty account.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField label="Full Name" value={form.full_name} onChange={(v: string) => setForm({ ...form, full_name: v })} placeholder="Jane Smith" required />
          <InputField label="Age" value={form.age} onChange={(v: string) => setForm({ ...form, age: v })} placeholder="32" type="number" />
          <SelectField label="Gender" value={form.gender} onChange={(v: string) => setForm({ ...form, gender: v })} options={["Male", "Female", "Other"]} placeholder="Select gender" />
          <InputField label="Login ID (Email)" value={form.login_id} onChange={(v: string) => setForm({ ...form, login_id: v })} placeholder="staff@college.edu" required />
          <InputField label="Password" value={form.password} onChange={(v: string) => setForm({ ...form, password: v })} placeholder="••••••••" type="password" required />
          <div className="md:col-span-2 flex justify-end pt-2">
            <button type="submit" disabled={loading}
              className="px-8 py-3.5 bg-[#005EB8] hover:bg-[#004a94] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200/50 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2 border-none cursor-pointer">
              {loading ? "Creating..." : "Create Staff Account"} <UserPlus size={18} />
            </button>
          </div>
        </form>
      </div>

      {staffList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)]">
          <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4">Existing Staff ({staffList.length})</h3>
          <div className="space-y-3">
            {staffList.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-extrabold text-sm">{s.full_name?.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 m-0">{s.full_name}</p>
                    <p className="text-[11px] text-slate-500 m-0">{s.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-wide">Staff</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ONBOARD STUDENTS TAB ───────────────────────────────────────
const OnboardStudents = ({ onSuccess }: { onSuccess: (msg: string) => void }) => {
  const [batchYear, setBatchYear] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [studentList, setStudentList] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [bulkData, setBulkData] = useState<any[]>([]);

  const selectionComplete = batchYear && department && section;

  useEffect(() => {
    if (selectionComplete) fetchStudents();
  }, [batchYear, department, section]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/superadmin/students?batch_year=${batchYear}&department=${department}&section=${section}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentList(res.data);
    } catch {}
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/superadmin/onboard-student`, { ...form, batch_year: batchYear, department, section }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess(`Student "${form.full_name}" created successfully!`);
      setForm({ full_name: "", email: "", password: "" });
      fetchStudents();
    } catch (err: any) {
      onSuccess(`Error: ${err.response?.data?.detail || "Failed"}`);
    } finally { setLoading(false); }
  };

  const handleFileChange = async (file: File) => {
    setFileName(file.name);
    const XLSX = await import("xlsx");
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(ws);
    // Map columns
    const mapped = json.map((row: any) => ({
      full_name: row["Full Name"] || row["full_name"] || row["Name"] || "",
      email: row["Email"] || row["email"] || row["Login ID"] || "",
      password: row["Password"] || row["password"] || row["Reg No"] || row["reg_no"] || ""
    }));
    setBulkData(mapped);
  };

  const handleBulkSubmit = async () => {
    if (bulkData.length === 0) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE_URL}/superadmin/bulk-onboard-students`, {
        students: bulkData, batch_year: batchYear, department, section
      }, { headers: { Authorization: `Bearer ${token}` } });
      onSuccess(res.data.message);
      setBulkData([]);
      setFileName("");
      fetchStudents();
    } catch (err: any) {
      onSuccess(`Error: ${err.response?.data?.detail || "Bulk upload failed"}`);
    } finally { setLoading(false); }
  };

  const downloadTemplate = () => {
    const csv = "Full Name,Email,Password\nJohn Doe,john@college.edu,REG001\nJane Smith,jane@college.edu,REG002";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "student_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* SELECTION CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100"><GraduationCap size={22} className="text-emerald-600" /></div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 m-0">Onboard Students</h3>
            <p className="text-xs text-slate-500 m-0">Select batch → department → class, then add students.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SelectField label="Batch Year" value={batchYear} onChange={setBatchYear} options={BATCH_YEARS} placeholder="Select batch year" required />
          <SelectField label="Department" value={department} onChange={setDepartment} options={DEPARTMENTS} placeholder="Select department" required />
          <SelectField label="Class (Section)" value={section} onChange={setSection} options={SECTIONS} placeholder="Select class" required />
        </div>

        {selectionComplete && (
          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-100/50">
            <p className="text-sm font-bold text-slate-700 m-0">
              <span className="text-emerald-600">{batchYear}</span> → <span className="text-blue-600">{department}</span> → <span className="text-purple-600">Section {section}</span>
              <span className="text-slate-400 ml-2">({studentList.length} students)</span>
            </p>
          </div>
        )}
      </div>

      {/* ONBOARDING FORMS (only shown after selection) */}
      {selectionComplete && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SINGLE ADMIT */}
          <div className={`bg-white rounded-2xl border-2 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)] transition-all cursor-pointer ${mode === "single" ? "border-[#005EB8] ring-2 ring-blue-100" : "border-slate-200/60"}`}
            onClick={() => setMode("single")}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-50 rounded-lg"><UserPlus size={20} className="text-blue-600" /></div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 m-0">Single Student Admit</h4>
                <p className="text-[11px] text-slate-500 m-0">Create account & assign to this batch manually.</p>
              </div>
            </div>

            {mode === "single" && (
              <form onSubmit={handleSingleSubmit} className="space-y-4 border-t border-slate-100 pt-5" onClick={(e) => e.stopPropagation()}>
                <InputField label="Full Name" value={form.full_name} onChange={(v: string) => setForm({ ...form, full_name: v })} placeholder="Student Name" required />
                <InputField label="Email (Login ID)" value={form.email} onChange={(v: string) => setForm({ ...form, email: v })} placeholder="student@college.edu" required />
                <InputField label="Password (Reg No)" value={form.password} onChange={(v: string) => setForm({ ...form, password: v })} placeholder="REG2024001" required />
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-[#005EB8] hover:bg-[#004a94] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200/50 transition-all active:scale-95 disabled:opacity-60 border-none cursor-pointer">
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </form>
            )}
          </div>

          {/* BULK UPLOAD */}
          <div className={`bg-white rounded-2xl border-2 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)] transition-all cursor-pointer ${mode === "bulk" ? "border-[#005EB8] ring-2 ring-blue-100" : "border-slate-200/60"}`}
            onClick={() => setMode("bulk")}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg"><Upload size={20} className="text-emerald-600" /></div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 m-0">Bulk Upload</h4>
                  <p className="text-[11px] text-slate-500 m-0">Upload Excel to onboard a whole batch.</p>
                </div>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                className="flex items-center gap-1.5 text-xs font-bold text-[#005EB8] hover:text-[#004a94] bg-transparent border-none cursor-pointer">
                <Download size={14} /> Template
              </button>
            </div>

            {mode === "bulk" && (
              <div className="space-y-4 border-t border-slate-100 pt-5" onClick={(e) => e.stopPropagation()}>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]); }}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileChange(e.target.files[0]); }} />
                  <Upload size={28} className="text-slate-400 mx-auto mb-3" />
                  {fileName ? (
                    <p className="text-sm font-bold text-emerald-600 m-0">{fileName} — {bulkData.length} students found</p>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-slate-600 m-0">Drop Excel File Here</p>
                      <p className="text-xs text-slate-400 m-0 mt-1">or click to browse</p>
                    </>
                  )}
                </div>

                {bulkData.length > 0 && (
                  <div className="max-h-40 overflow-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold text-slate-500">#</th>
                          <th className="px-3 py-2 text-left font-bold text-slate-500">Name</th>
                          <th className="px-3 py-2 text-left font-bold text-slate-500">Email</th>
                          <th className="px-3 py-2 text-left font-bold text-slate-500">Reg No</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkData.slice(0, 10).map((s, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                            <td className="px-3 py-2 text-slate-700 font-medium">{s.full_name}</td>
                            <td className="px-3 py-2 text-slate-500">{s.email}</td>
                            <td className="px-3 py-2 text-slate-500">{s.password}</td>
                          </tr>
                        ))}
                        {bulkData.length > 10 && <tr><td colSpan={4} className="px-3 py-2 text-center text-slate-400 text-xs">...and {bulkData.length - 10} more</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}

                <button type="button" onClick={handleBulkSubmit} disabled={loading || bulkData.length === 0}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200/50 transition-all active:scale-95 disabled:opacity-60 border-none cursor-pointer">
                  {loading ? "Processing..." : `Process Batch Upload (${bulkData.length})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STUDENT LIST */}
      {selectionComplete && studentList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)]">
          <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4">
            Students in {batchYear} / {department} / Section {section} ({studentList.length})
          </h3>
          <div className="space-y-2">
            {studentList.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-extrabold text-xs">{s.full_name?.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 m-0">{s.full_name}</p>
                    <p className="text-[11px] text-slate-500 m-0">{s.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wide">Student</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SHARED FORM FIELDS ─────────────────────────────────────────
const InputField = ({ label, value, onChange, placeholder, type = "text", required = false }: any) => (
  <div>
    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#005EB8]/30 focus:border-[#005EB8] transition-all" />
  </div>
);

const SelectField = ({ label, value, onChange, options, placeholder, required = false }: any) => (
  <div>
    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#005EB8]/30 focus:border-[#005EB8] transition-all appearance-none cursor-pointer">
        <option value="">{placeholder}</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

// ─── MAIN SUPER ADMIN DASHBOARD ─────────────────────────────────
const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"hod" | "staff" | "students" | "manage-hod" | "manage-staff" | "manage-students" | "settings">("manage-students");
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });
  const [stats, setStats] = useState({ hods: 0, staff: 0, students: 0, courses: 0 });
  const [userData, setUserData] = useState({ name: "Loading...", email: "...", profile_picture: "" });

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      setUserData({
        name: res.data.full_name || "Super Admin",
        email: res.data.email || "",
        profile_picture: res.data.profile_picture || ""
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchProfile();
    window.addEventListener("profileUpdated", fetchProfile);
    return () => window.removeEventListener("profileUpdated", fetchProfile);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/superadmin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data);
    } catch {}
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  const triggerToast = (message: string) => {
    const type = message.startsWith("Error") ? "error" : "success";
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    if (type === "success") fetchStats();
  };

  const tabs = [
    { key: "manage-students" as const, label: "Manage Students", icon: <Users size={18} />, color: "text-slate-600" },
    { key: "manage-staff" as const, label: "Manage Staff", icon: <Briefcase size={18} />, color: "text-slate-600" },
    { key: "manage-hod" as const, label: "Manage HOD", icon: <Shield size={18} />, color: "text-slate-600" },
    { key: "students" as const, label: "Onboard Students", icon: <GraduationCap size={18} />, color: "text-emerald-600" },
    { key: "staff" as const, label: "Onboard Staff", icon: <UserPlus size={18} />, color: "text-blue-600" },
    { key: "hod" as const, label: "Onboard HOD", icon: <Shield size={18} />, color: "text-amber-600" },
    { key: "settings" as const, label: "Account Settings", icon: <Settings size={18} />, color: "text-slate-500" },
  ];

  const statCards = [
    { label: "HODs", value: stats.hods, icon: <Shield size={20} />, color: "bg-amber-50 text-amber-700 border-amber-100" },
    { label: "Staff", value: stats.staff, icon: <Briefcase size={20} />, color: "bg-blue-50 text-blue-600 border-blue-100" },
    { label: "Students", value: stats.students, icon: <GraduationCap size={20} />, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { label: "Courses", value: stats.courses, icon: <BookOpen size={20} />, color: "bg-purple-50 text-purple-600 border-purple-100" },
  ];

  return (
    <div className="flex min-h-screen bg-[#f1f5f9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200/80 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <BrandLogo size="md" />
            <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-[0.2em] mt-1.5 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-100">Super Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1.5">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 border-none cursor-pointer ${
                  isActive
                    ? "bg-[#005EB8] text-white shadow-md shadow-blue-200/50"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 bg-transparent"
                }`}>
                <div className={isActive ? "text-white" : tab.color}>{tab.icon}</div>
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
          <h2 className="text-lg font-extrabold text-slate-800 m-0">Super Admin Control Panel</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium truncate" title={userData.email}>{userData.email}</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-lg border border-slate-200 overflow-hidden">
                {userData.profile_picture ? (
                    <img src={userData.profile_picture.startsWith('http') ? userData.profile_picture : `${API_BASE_URL.replace('/api/v1', '')}${userData.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    userData.name.charAt(0).toUpperCase()
                )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto bg-[#f1f5f9] p-8">
          {/* STAT CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map(card => (
              <div key={card.label} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)]">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl border ${card.color}`}>{card.icon}</div>
                  <BarChart3 size={14} className="text-slate-300" />
                </div>
                <p className="text-2xl font-extrabold text-slate-800 m-0">{card.value}</p>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider m-0 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* ACTIVE TAB CONTENT */}
          {activeTab === "manage-students" && <ManageStudents onSuccess={triggerToast} />}
          {activeTab === "manage-staff" && <ManageStaff onSuccess={triggerToast} />}
          {activeTab === "manage-hod" && <ManageHod onSuccess={triggerToast} />}
          {activeTab === "hod" && <OnboardHod onSuccess={triggerToast} />}
          {activeTab === "staff" && <OnboardStaff onSuccess={triggerToast} />}
          {activeTab === "students" && <OnboardStudents onSuccess={triggerToast} />}
          {activeTab === "settings" && <div className="-mx-4 md:-mx-8"><AccountSettings /></div>}
        </div>
      </main>

      <Toast toast={toast} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
    </div>
  );
};

export default SuperAdminDashboard;
