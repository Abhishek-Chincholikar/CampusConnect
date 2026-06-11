import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserCheck, 
  Megaphone, 
  FileSpreadsheet, 
  Building2, 
  LogOut, 
  GraduationCap 
} from 'lucide-react';

function FacultyDashboard({ session, onLogout }) {
  const user = session?.user;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      {/* Top Professional Faculty Banner */}
      <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
            <GraduationCap size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {user?.full_name} (Faculty Coordinator)
            </h1>
            <p className="text-xs text-emerald-600 font-semibold tracking-wide uppercase mt-0.5">
              SIESCOMS Academic & Governance Panel Active
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 px-4 py-2 rounded-lg font-semibold text-sm transition duration-150 border border-slate-200 hover:border-rose-200 shadow-sm"
        >
          <LogOut size={16} />
          Logout Session
        </button>
      </div>

      {/* Main Feature Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        
        <Link 
          to="/admin/organizations" 
          className="flex items-center gap-4 bg-white border border-slate-200 p-5 rounded-xl hover:border-emerald-500 hover:shadow-lift transition duration-200 group"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
            <Building2 size={22} />
          </span>
          <div>
            <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition">
              Manage Clubs & Committees
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Create, structure, or disband institutional student bodies.
            </p>
          </div>
        </Link>

        {/* Note: This points to your existing application logic if needed, or you can route to user management */}
        <Link 
          to="/admin/users" 
          className="flex items-center gap-4 bg-white border border-slate-200 p-5 rounded-xl hover:border-emerald-500 hover:shadow-lift transition duration-200 group"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
            <UserCheck size={22} />
          </span>
          <div>
            <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition">
              Review Student Applications
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Moderate applicant workflows, review roles, and approve members.
            </p>
          </div>
        </Link>

        <Link 
          to="/admin/announcements" 
          className="flex items-center gap-4 bg-white border border-slate-200 p-5 rounded-xl hover:border-emerald-500 hover:shadow-lift transition duration-200 group"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
            <Megaphone size={22} />
          </span>
          <div>
            <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition">
              Publish Notice Broadcasts
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Emit important announcements directly to the student portal tracker.
            </p>
          </div>
        </Link>

        <Link 
          to="/admin/reports" 
          className="flex items-center gap-4 bg-white border border-slate-200 p-5 rounded-xl hover:border-emerald-500 hover:shadow-lift transition duration-200 group"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
            <FileText size={22} />
          </span>
          <div>
            <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition">
              Audit PDF Activity Reports
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Access and monitor doc uploads committed by committee heads.
            </p>
          </div>
        </Link>

      </div>
    </div>
  );
}

export default FacultyDashboard;