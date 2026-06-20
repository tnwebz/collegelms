import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from './config';
import { User, Search } from "lucide-react";

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

  useEffect(() => {
    fetchStaffBatches();
  }, []);

  const fetchStaffBatches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/staff/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allBatches = res.data.flatMap((course: any) => 
        course.batches.map((b: any) => ({ ...b, course_title: course.title }))
      );
      setBatches(allBatches);
      if (allBatches.length > 0) {
        setSelectedBatchId(allBatches[0].id);
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

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: brand.textMain, margin: 0 }}>My Students</h1>
          <p style={{ color: brand.textLight, marginTop: "5px" }}>Manage students enrolled in your specific course sections.</p>
        </div>

        <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "500px", flexDirection: "row" }}>
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
    </div>
  );
};

export default StaffStudentManagement;
