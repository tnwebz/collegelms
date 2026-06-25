import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { User, Mail, Phone, Lock, Save, Camera, CheckCircle, AlertCircle, MapPin, Building2, BookOpen, GraduationCap, Briefcase } from "lucide-react";
import API_BASE_URL from './config';

const AccountSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [designation, setDesignation] = useState(""); // For staff
  
  // Profile Picture State
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return "";
    return url.startsWith('http') ? url : `${API_BASE_URL.replace('/api/v1', '')}${url}`;
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      const user = res.data;
      setUserData(user);
      
      setFullName(user.full_name || "");
      setEmail(user.email || "");
      setPhone(user.phone_number || "");
      setAddress(user.address || "");
      setProfilePicPreview(getImageUrl(user.profile_picture));
      
      if (user.role === 'STAFF' && user.staff_profile) {
        setDesignation(user.staff_profile.designation || "");
      }
    } catch (err) {
      triggerToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        triggerToast("Image must be less than 5MB", "error");
        return;
      }
      setProfilePic(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password.length < 6) {
      triggerToast("Password must be at least 6 characters", "error");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      formData.append("full_name", fullName);
      formData.append("email", email);
      formData.append("phone_number", phone);
      formData.append("address", address);
      if (password) formData.append("password", password);
      if (profilePic) formData.append("profile_picture", profilePic);
      
      if (userData?.role === 'STAFF') {
        formData.append("designation", designation);
      }

      await axios.put(`${API_BASE_URL}/users/me`, formData, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        } 
      });
      
      triggerToast("Profile updated successfully", "success");
      setPassword(""); // Clear password field
      
      // Dispatch custom event to notify headers to refresh
      window.dispatchEvent(new Event("profileUpdated"));
      
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-slate-500 flex justify-center">Loading profile...</div>;

  const role = userData?.role || "STUDENT";
  const student = userData?.student_profile;
  const staff = userData?.staff_profile;
  const hod = userData?.hod_profile;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Header Area */}
        <div className="bg-slate-50 border-b border-slate-200 p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative">
          
          {/* Avatar Upload */}
          <div className="relative group shrink-0">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-200 flex items-center justify-center">
              {profilePicPreview ? (
                <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-extrabold text-slate-400">{fullName?.charAt(0) || "U"}</span>
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2.5 bg-[#005EB8] text-white rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-white cursor-pointer"
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/jpeg,image/png,image/jpg" 
              className="hidden" 
            />
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 m-0">{fullName || "Your Name"}</h1>
            <p className="text-slate-500 font-medium m-0 mt-1 flex items-center justify-center md:justify-start gap-2">
              <Mail size={16} /> {email || "No email"}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100">
              <User size={14} /> {role}
            </div>
          </div>
        </div>

        {/* Read-Only Academic/Role Information */}
        <div className="bg-slate-50/50 p-6 md:p-8 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {role === 'STUDENT' && student && (
            <>
              <InfoBox icon={Building2} label="Department" value={student.branch} />
              <InfoBox icon={GraduationCap} label="Semester" value={`Sem ${student.current_semester}`} />
              <InfoBox icon={BookOpen} label="Section" value={`Sec ${student.section}`} />
              <InfoBox icon={User} label="Register No" value={student.register_number || userData.login_id} />
            </>
          )}
          {role === 'STAFF' && staff && (
            <>
              <InfoBox icon={Building2} label="Department" value={staff.department} />
              <InfoBox icon={GraduationCap} label="Qualification" value={staff.qualification} />
            </>
          )}
          {role === 'HOD' && hod && (
            <>
              <InfoBox icon={Building2} label="Department" value={hod.department} />
            </>
          )}
        </div>

        {/* Edit Form */}
        <div className="p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <SettingsIcon /> Edit Personal Information
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><User size={18} /></div>
                  <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#005EB8] focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={18} /></div>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#005EB8] focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Phone size={18} /></div>
                  <input type="text" placeholder="Optional" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#005EB8] focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
              </div>

              {role === 'STUDENT' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><MapPin size={18} /></div>
                    <input type="text" placeholder="Optional" value={address} onChange={e => setAddress(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#005EB8] focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>
                </div>
              )}

              {role === 'STAFF' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Designation</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Briefcase size={18} /></div>
                    <input type="text" placeholder="e.g. Assistant Professor" value={designation} onChange={e => setDesignation(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#005EB8] focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>
                </div>
              )}
            </div>

            <hr className="border-slate-100 my-6" />

            <div className="md:w-1/2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Change Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></div>
                <input type="password" placeholder="Leave blank to keep current" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#005EB8] focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={saving}
                className="px-8 py-3.5 bg-[#005EB8] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200/50 disabled:opacity-50 border-none cursor-pointer"
              >
                <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-[9999] bg-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3 animate-fade-in-up" style={{ borderLeft: `5px solid ${toast.type === "success" ? "#059669" : "#ef4444"}` }}>
          {toast.type === "success" ? <CheckCircle size={22} className="text-emerald-600" /> : <AlertCircle size={22} className="text-red-500" />}
          <div>
            <h4 className="text-sm font-bold text-slate-800 m-0">{toast.type === "success" ? "Success" : "Error"}</h4>
            <p className="text-xs text-slate-500 m-0 mt-0.5">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#005EB8]"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const InfoBox = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | undefined }) => (
  <div className="flex items-center gap-3">
    <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider m-0">{label}</p>
      <p className="text-sm font-bold text-slate-700 m-0 truncate max-w-[120px]" title={value || "N/A"}>{value || "N/A"}</p>
    </div>
  </div>
);

export default AccountSettings;
