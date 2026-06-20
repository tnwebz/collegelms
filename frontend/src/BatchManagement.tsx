import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from './config';
import { Layers, Plus, Users, X, UserPlus, FileSpreadsheet, Download, Upload } from "lucide-react";

interface Batch {
  id: number;
  semester: number;
  section: string;
  year?: number;
  status: string;
  enrolled_students: number;
}

interface Course {
  id: number;
  title: string;
  batches: Batch[];
}

const BatchManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Batch State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBatchCourseId, setNewBatchCourseId] = useState<number | "">("");
  const [newBatchSemester, setNewBatchSemester] = useState<number>(1);
  const [newBatchSection, setNewBatchSection] = useState("A");
  const [newBatchYear, setNewBatchYear] = useState<number>(new Date().getFullYear());

  // Admit Students State
  const [showAdmitModal, setShowAdmitModal] = useState<number | null>(null);
  const [singleName, setSingleName] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);



  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/staff/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!newBatchCourseId) return alert("Select a course");
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/courses/${newBatchCourseId}/batches`, {
        semester: newBatchSemester,
        section: newBatchSection,
        year: newBatchYear
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowCreateModal(false);
      fetchDashboard();
    } catch (err) {
      alert("Failed to create batch");
    }
  };

  const handleSingleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdmitModal) return;
    setSingleLoading(true);

    const generatedPassword = Math.random().toString(36).slice(-8) + "1!";
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/admin/admit-student`, {
        full_name: singleName,
        email: singleEmail,
        batch_ids: [showAdmitModal],
        password: generatedPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Account Created & Email Sent to ${singleEmail}`);
      setSingleName("");
      setSingleEmail("");
      fetchDashboard();
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.detail || "Failed"}`);
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBulkAdmit = async () => {
    if (!bulkFile || !showAdmitModal) return alert("Missing file.");
    setBulkLoading(true);
    const formData = new FormData();
    formData.append("file", bulkFile);
    formData.append("batch_id", showAdmitModal.toString());
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/admin/bulk-admit`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      alert(`Bulk Process Complete! Emails Sent.`);
      setBulkFile(null);
      fetchDashboard();
    } catch (err: any) {
      alert("Upload failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email\nJohn Doe,john@college.edu";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_template.csv");
    document.body.appendChild(link); link.click();
  };

  if (loading) return <div className="p-10 text-slate-500">Loading...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-[#005EB8]" /> Batch Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Create instances and assign students securely.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#005EB8] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> New Batch
        </button>
      </div>

      <div className="space-y-6">
        {courses.map(course => (
          <div key={course.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">{course.title}</h2>
            {course.batches.length === 0 ? (
              <p className="text-slate-400 text-sm italic">No batches created yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {course.batches.map(batch => (
                  <div key={batch.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative group">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-700">Sem {batch.semester} - Sec {batch.section} {batch.year && `(${batch.year})`}</h3>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">{batch.status}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                      <Users size={14} /> {batch.enrolled_students} Enrolled
                    </p>
                    <button
                      onClick={() => setShowAdmitModal(batch.id)}
                      className="w-full text-center text-sm font-bold text-[#005EB8] bg-blue-50 py-2 rounded-md hover:bg-[#005EB8] hover:text-white transition-colors"
                    >
                      + Admit Students
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CREATE BATCH MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Create New Batch</h2>
              <button onClick={() => setShowCreateModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Select Course</label>
                <select value={newBatchCourseId} onChange={e => setNewBatchCourseId(Number(e.target.value))} className="w-full p-3 border border-slate-300 rounded-lg outline-none">
                  <option value="">-- Choose Course --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-600 mb-1">Semester</label>
                  <input type="number" min={1} value={newBatchSemester} onChange={e => setNewBatchSemester(Number(e.target.value))} className="w-full p-3 border border-slate-300 rounded-lg outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-600 mb-1">Section</label>
                  <input type="text" value={newBatchSection} onChange={e => setNewBatchSection(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg outline-none" placeholder="e.g. A" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-600 mb-1">Year</label>
                  <input type="number" min={2000} value={newBatchYear} onChange={e => setNewBatchYear(Number(e.target.value))} className="w-full p-3 border border-slate-300 rounded-lg outline-none" />
                </div>
              </div>
              <button onClick={handleCreateBatch} className="w-full bg-[#005EB8] text-white p-3 rounded-lg font-bold hover:bg-blue-700 mt-4">Create Batch</button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIT STUDENTS MODAL */}
      {showAdmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
          <div className="bg-[#f8fafc] w-full max-w-5xl p-6 md:p-10 rounded-2xl shadow-2xl relative my-auto mx-4">
            <button onClick={() => setShowAdmitModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer">
              <X size={24} />
            </button>
            
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#1e293b]">Admit to Batch</h2>
              <p className="text-slate-500 font-medium mt-1">Create accounts or upload a spreadsheet to automatically enroll them.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
              {/* LEFT: SINGLE ADMIT */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-5 mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-[#1e293b]">
                    <UserPlus size={20} className="text-[#005EB8]" /> Single Student Admit
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">Create account & assign to this batch manually.</p>
                </div>
                <form onSubmit={handleSingleAdmit} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                    <input required value={singleName} onChange={e => setSingleName(e.target.value)} placeholder="Student Name" className="w-full p-3 rounded-lg border border-slate-300 text-sm focus:border-[#005EB8] focus:ring-1 focus:ring-[#005EB8] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input required type="email" value={singleEmail} onChange={e => setSingleEmail(e.target.value)} placeholder="student@college.edu" className="w-full p-3 rounded-lg border border-slate-300 text-sm focus:border-[#005EB8] focus:ring-1 focus:ring-[#005EB8] outline-none transition-all" />
                  </div>
                  <button disabled={singleLoading} type="submit" className="w-full mt-2 py-3.5 bg-[#005EB8] text-white rounded-xl font-bold text-sm hover:bg-[#004e9a] transition-all flex justify-center items-center shadow-md shadow-blue-100 disabled:opacity-70 disabled:cursor-not-allowed">
                    {singleLoading ? "Processing..." : "Create Account & Send Email"}
                  </button>
                </form>
              </div>

              {/* RIGHT: BULK ADMIT */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
                <div className="border-b border-slate-100 pb-5 mb-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 text-[#1e293b]">
                      <FileSpreadsheet size={20} className="text-[#94A3B8]" /> Bulk Upload
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Upload Excel to onboard a whole batch.</p>
                  </div>
                  <button onClick={downloadTemplate} className="text-xs font-bold text-[#005EB8] flex items-center gap-1.5 hover:underline bg-transparent border-none cursor-pointer">
                    <Download size={14} /> Template
                  </button>
                </div>
                <div className="flex flex-col gap-6 flex-1">
                  <div className="flex-1 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center min-h-[200px] bg-[#f8fafc] relative hover:bg-slate-50 transition-colors group">
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => setBulkFile(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {bulkFile ? (
                      <div className="text-center">
                        <FileSpreadsheet size={48} className="text-[#94A3B8] mx-auto mb-2" />
                        <div className="font-bold text-slate-700">{bulkFile.name}</div>
                        <div className="text-xs text-slate-400 mt-1">Click to change file</div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="bg-white p-3 rounded-full shadow-sm mb-3 mx-auto w-fit group-hover:scale-110 transition-transform">
                          <Upload size={24} className="text-slate-400" />
                        </div>
                        <div className="font-bold text-slate-600">Drop Excel File Here</div>
                        <div className="text-xs text-slate-400 mt-1">or click to browse</div>
                      </div>
                    )}
                  </div>
                  <button disabled={bulkLoading} onClick={handleBulkAdmit} className="w-full py-3.5 bg-[#94A3B8] text-white rounded-xl font-bold text-sm hover:bg-[#76a928] transition-all shadow-md shadow-green-100 disabled:opacity-70 disabled:cursor-not-allowed">
                    {bulkLoading ? "Processing..." : "Process Batch Upload"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BatchManagement;
