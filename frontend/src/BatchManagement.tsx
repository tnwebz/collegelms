import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from './config';
import { Layers, Plus, Users, X, BookOpen } from "lucide-react";

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
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Batch State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBatchCourseId, setNewBatchCourseId] = useState<number | "">("");
  const [newBatchSemester, setNewBatchSemester] = useState<number>(1);
  const [newBatchSection, setNewBatchSection] = useState("A");
  const [newBatchYear, setNewBatchYear] = useState<number>(new Date().getFullYear());

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

  // Flatten all batches with their course info for grid display
  const allBatches = courses.flatMap(course =>
    course.batches.map(batch => ({ ...batch, courseTitle: course.title, courseId: course.id }))
  );

  if (loading) return <div className="p-10 text-slate-500">Loading...</div>;

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 m-0">
            <Layers className="text-[#005EB8]" /> Batch Management
          </h1>
          <p className="text-slate-500 text-sm mt-1 m-0">Manage your course batches — click any batch to open its dashboard.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#005EB8] text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors border-none cursor-pointer shadow-md shadow-blue-100"
        >
          <Plus size={18} /> New Batch
        </button>
      </div>

      {/* BATCH GRID */}
      {allBatches.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <BookOpen size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600 m-0">No Batches Yet</h3>
          <p className="text-sm text-slate-400 mt-2">Create your first batch using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {allBatches.map(batch => (
            <div
              key={batch.id}
              onClick={() => navigate(`/dashboard/batch/${batch.id}`)}
              className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:shadow-lg hover:border-[#005EB8]/30 transition-all group relative overflow-hidden"
              style={{ transition: "all 0.2s ease" }}
            >
              {/* Decorative top bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ background: batch.status === "ACTIVE" ? "#005EB8" : "#94a3b8" }}
              />

              {/* Status badge */}
              <div className="flex justify-between items-start mb-3 mt-1">
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                    batch.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {batch.status}
                </span>
              </div>

              {/* Course Title */}
              <h3 className="text-base font-extrabold text-slate-800 m-0 mb-1 truncate group-hover:text-[#005EB8] transition-colors">
                {batch.courseTitle}
              </h3>

              {/* Batch Info */}
              <p className="text-sm text-slate-500 m-0 mb-4">
                Sem {batch.semester} — Sec {batch.section}
                {batch.year && <span className="text-slate-400"> ({batch.year})</span>}
              </p>

              {/* Enrolled Count */}
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                <Users size={16} className="text-[#005EB8]" />
                <span className="font-bold">{batch.enrolled_students}</span>
                <span className="text-slate-400">enrolled</span>
              </div>

              {/* Hover Indicator */}
              <div className="mt-4 text-center text-xs font-bold text-[#005EB8] opacity-0 group-hover:opacity-100 transition-opacity">
                Click to manage →
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE BATCH MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Create New Batch</h2>
              <button onClick={() => setShowCreateModal(false)} className="bg-transparent border-none cursor-pointer"><X className="text-slate-400 hover:text-slate-600" /></button>
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
              <button onClick={handleCreateBatch} className="w-full bg-[#005EB8] text-white p-3 rounded-lg font-bold hover:bg-blue-700 mt-4 border-none cursor-pointer">Create Batch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManagement;
