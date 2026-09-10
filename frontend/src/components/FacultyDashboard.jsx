import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Megaphone, FileSpreadsheet, Building2, LogOut, GraduationCap } from 'lucide-react';

function FacultyDashboard({ session, onLogout }) {
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
    <div className="min-h-screen bg-institute-mist p-6 md:p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:justify-between md:items-center bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8"
      >
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-institute-navy text-white shadow-md">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-institute-ink">
              {user?.full_name || 'Faculty Member'}
            </h1>
            <p className="text-xs text-institute-blue font-bold tracking-wider uppercase mt-1">
              SIESCOMS Academic & Governance Panel Active
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 bg-slate-50 hover:bg-cardinal-50 text-slate-600 hover:text-cardinal-700 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border border-slate-200 hover:border-cardinal-200 shadow-sm"
        >
          <LogOut size={18} />
          Logout Session
        </button>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl"
      >
        <motion.div variants={itemVariants}>
          <Link to="/admin/organizations" className="flex flex-col h-full bg-white border border-slate-200 p-6 rounded-2xl hover:border-institute-blue hover:shadow-lg transition-all duration-300 group">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-institute-blue mb-4 transition-colors group-hover:bg-institute-blue group-hover:text-white">
              <Building2 size={24} />
            </span>
            <div>
              <h3 className="font-bold text-lg text-institute-ink group-hover:text-institute-blue transition-colors">
                Manage Committees & Clubs
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Create, structure, or disband institutional student bodies.
              </p>
            </div>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link to="/admin/announcements" className="flex flex-col h-full bg-white border border-slate-200 p-6 rounded-2xl hover:border-institute-blue hover:shadow-lg transition-all duration-300 group">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-institute-blue mb-4 transition-colors group-hover:bg-institute-blue group-hover:text-white">
              <Megaphone size={24} />
            </span>
            <div>
              <h3 className="font-bold text-lg text-institute-ink group-hover:text-institute-blue transition-colors">
                Publish Notice Broadcasts
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Emit important announcements directly to the student portal tracker.
              </p>
            </div>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link to="/admin/reports" className="flex flex-col h-full bg-white border border-slate-200 p-6 rounded-2xl hover:border-institute-blue hover:shadow-lg transition-all duration-300 group">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-institute-blue mb-4 transition-colors group-hover:bg-institute-blue group-hover:text-white">
              <FileSpreadsheet size={24} />
            </span>
            <div>
              <h3 className="font-bold text-lg text-institute-ink group-hover:text-institute-blue transition-colors">
                Audit PDF Activity Reports
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Access and monitor doc uploads committed by committee heads.
              </p>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default FacultyDashboard;