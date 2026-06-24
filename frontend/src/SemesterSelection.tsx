import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, ChevronRight } from "lucide-react";

const SemesterSelection = () => {
  const navigate = useNavigate();

  const handleSemesterSelect = (semester: number) => {
    localStorage.setItem("current_semester", semester.toString());
    
    // Redirect based on role
    const role = localStorage.getItem("role")?.toUpperCase();
    if (role === "STUDENT") {
      navigate("/student-dashboard");
    } else if (role === "SUPERADMIN") {
      navigate("/superadmin-dashboard");
    } else if (role === "HOD") {
      navigate("/admin-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const semesters = [
    { num: 1, title: "Semester I", desc: "First Year - Odd" },
    { num: 2, title: "Semester II", desc: "First Year - Even" },
    { num: 3, title: "Semester III", desc: "Second Year - Odd" },
    { num: 4, title: "Semester IV", desc: "Second Year - Even" },
    { num: 5, title: "Semester V", desc: "Third Year - Odd" },
    { num: 6, title: "Semester VI", desc: "Third Year - Even" },
    { num: 7, title: "Semester VII", desc: "Final Year - Odd" },
    { num: 8, title: "Semester VIII", desc: "Final Year - Even" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#005EB8] opacity-10 blur-3xl rounded-full mix-blend-multiply animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-[#10b981] opacity-10 blur-3xl rounded-full mix-blend-multiply animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 max-w-5xl w-full">
        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-xl shadow-blue-500/10 mb-6 border border-slate-100">
            <GraduationCap size={40} className="text-[#005EB8]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1e293b] tracking-tight mb-4">
            Select Your Semester
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Choose your current academic semester to access your tailored dashboard, enrolled courses, and assignments.
          </p>
        </div>

        {/* Semesters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
          {semesters.map((sem, index) => (
            <button
              key={sem.num}
              onClick={() => handleSemesterSelect(sem.num)}
              className="group relative bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgba(0,94,184,0.12)] transition-all duration-300 hover:-translate-y-2 overflow-hidden text-left"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Hover Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#005EB8]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-[#005EB8] group-hover:text-white transition-colors duration-300">
                    <span className="font-black text-xl">{sem.num}</span>
                  </div>
                  <ChevronRight size={24} className="text-slate-300 group-hover:text-[#005EB8] transition-colors duration-300 transform group-hover:translate-x-1" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-[#1e293b] mb-2">{sem.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <BookOpen size={16} className="text-slate-400 group-hover:text-[#005EB8] transition-colors" />
                    <span>{sem.desc}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fadeInDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-up { opacity: 0; animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 0.2s; }
      `}</style>
    </div>
  );
};

export default SemesterSelection;
