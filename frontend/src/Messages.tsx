import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from './config';
import { Send, Users, Layers, User } from "lucide-react";

interface Batch {
  id: number;
  course_title: string;
  semester: number;
  section: string;
}

interface Student {
  id: number;
  full_name: string;
  email: string;
}

const Messages = () => {
    const [targetType, setTargetType] = useState("all"); // all, batch, student
    const [targetId, setTargetId] = useState("");
    const [message, setMessage] = useState("");
    const [batches, setBatches] = useState<Batch[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    useEffect(() => {
        const fetchStaffData = async () => {
            const token = localStorage.getItem("token");
            try {
                // 1. Fetch Staff Batches
                const res = await axios.get(`${API_BASE_URL}/staff/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
                const fetchedBatches: Batch[] = [];
                res.data.forEach((course: any) => {
                    course.batches.forEach((b: any) => {
                        fetchedBatches.push({
                            id: b.id,
                            course_title: course.title,
                            semester: b.semester,
                            section: b.section
                        });
                    });
                });
                setBatches(fetchedBatches);

                // 2. Fetch Students for the staff
                const studentsRes = await axios.get(`${API_BASE_URL}/admin/students`, { headers: { Authorization: `Bearer ${token}` } });
                setStudents(studentsRes.data);
            } catch (err) {
                console.error("Failed to load messaging context", err);
            }
        };
        fetchStaffData();
    }, []);

    const handleSend = async () => {
        if(!message) return alert("Please type a message");
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${API_BASE_URL}/notifications/send`, {
                target_type: targetType,
                target_id: targetId ? parseInt(targetId) : null,
                message
            }, { headers: { Authorization: `Bearer ${token}` } });
            alert("Message Sent!");
            setMessage("");
        } catch(err) { alert("Failed to send"); }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Broadcast Messages</h1>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-500 uppercase mb-2">To Whom?</label>
                    <div className="flex gap-4">
                        <button onClick={() => setTargetType("all")} className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${targetType === "all" ? "bg-blue-50 border-blue-500 text-blue-600 font-bold" : "border-slate-200 text-slate-500"}`}><Users size={18}/> All Students</button>
                        <button onClick={() => setTargetType("batch")} className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${targetType === "batch" ? "bg-blue-50 border-blue-500 text-blue-600 font-bold" : "border-slate-200 text-slate-500"}`}><Layers size={18}/> Specific Batch</button>
                        <button onClick={() => setTargetType("student")} className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${targetType === "student" ? "bg-blue-50 border-blue-500 text-blue-600 font-bold" : "border-slate-200 text-slate-500"}`}><User size={18}/> Specific Student</button>
                    </div>
                </div>

                {targetType === "batch" && (
                    <select className="w-full p-3 border rounded-lg" onChange={(e) => setTargetId(e.target.value)}>
                        <option value="">Select Batch...</option>
                        {batches.map((b) => <option key={b.id} value={b.id}>{b.course_title} (Sem {b.semester} - Sec {b.section})</option>)}
                    </select>
                )}
                {targetType === "student" && (
                    <select className="w-full p-3 border rounded-lg" onChange={(e) => setTargetId(e.target.value)}>
                        <option value="">Select Student...</option>
                        {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
                    </select>
                )}

                <div>
                    <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Message</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="Type your announcement here..."></textarea>
                </div>

                <button onClick={handleSend} className="bg-[#005EB8] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"><Send size={18} /> Send Notification</button>
            </div>
        </div>
    );
};
export default Messages;