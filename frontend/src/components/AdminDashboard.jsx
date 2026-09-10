import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Megaphone, FileSpreadsheet, Building2, LogOut } from 'lucide-react';

function AdminDashboard({ session, onLogout }) {
  const user = session?.user;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      
      {/* Top Professional Admin Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:justify-between md:items-center bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8"
      >
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1e3a8a] text-white shadow-md">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {user?.full_name || 'Administrator'}
            </h1>
            <p className="text-xs text-blue-700 font-bold tracking-wider uppercase mt-1">
              System Admin Console • Core Access
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border border-slate-200 hover:border-rose-200 shadow-sm"
        >
          <LogOut size={18} />
          Terminate Session
        </button>
      </motion.div>

      {/* Main Feature Navigation Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Link to="/admin/users" className="flex flex-col h-full bg-white border border-slate-200 p-6 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all duration-300 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">Manage Users</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Control student, head, and faculty access privileges.</p>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link to="/admin/announcements" className="flex flex-col h-full bg-white border border-slate-200 p-6 rounded-2xl hover:border-amber-500 hover:shadow-lg transition-all duration-300 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Megaphone size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">Global Announcements</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Broadcast institute-wide alerts to all dashboards.</p>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link to="/admin/reports" className="flex flex-col h-full bg-white border border-slate-200 p-6 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all duration-300 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileSpreadsheet size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">PDF Reports</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Audit and review committee documentation and logs.</p>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link to="/admin/organizations" className="flex flex-col h-full bg-white border border-slate-200 p-6 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition-all duration-300 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Building2 size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">Committees & Clubs</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Create, structure, and disband institutional student bodies.</p>
          </Link>
        </motion.div>
      </motion.div>
      
    </div>
  );
}

export default AdminDashboard;