import { API_BASE_URL } from '../config.js';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

function AdminUsers({ session }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // --- 🛠️ DYNAMIC BASE URL PARSER FOR ONLINE VERSIONS ---
  const getBackendUrl = () => {
    // If running online, it extracts the target base API from current window window parameters 
    // or falls back directly to your standard development channel ports
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : `${window.location.origin.replace('5173', '5000')}/api`; 
      // Replace this string with your explicit Render/Vercel backend domain if you have it!
  };

  const fetchUsers = async () => {
    try {
      const token = window.localStorage.getItem('campusconnect_token');
      const response = await fetch(`${getBackendUrl()}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to fetch user list');
      
      const rawApplications = body.data || [];
      const currentUserEmail = String(session?.user?.email || '').toLowerCase().trim();

      if (session?.user?.role === 'Faculty' && currentUserEmail === 'nehac@sies.edu.in') {
        const facultyScopeFiltered = rawApplications.filter(app => 
          String(app.organization?.name || app.organization_name || '').toUpperCase().includes('POSH')
        );
        setUsers(facultyScopeFiltered);
      } else {
        setUsers(rawApplications);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [session]);

  useEffect(() => {
    if (!selectedApp) return;

    const handleOutsideClickClose = (e) => {
      if (e.target.closest('.drawer-panel-overlay') && !e.target.closest('.drawer-content-card')) {
        setSelectedApp(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClickClose);
    return () => document.removeEventListener('mousedown', handleOutsideClickClose);
  }, [selectedApp]);

  const handleUpdateStatus = async (appId, newStatus) => {
    let statusText = 'Rejected';
    if (newStatus === 'Accepted') {
      statusText = 'Approved';
    } else if (newStatus === 'Pending') {
      statusText = 'Pending';
    }

    if (!window.confirm(`Confirm shifting this student application state to: ${statusText}?`)) return;
    
    setActionLoading(true);
    try {
      const token = window.localStorage.getItem('campusconnect_token');
      
      const finalUrlPath = statusText === 'Approved'
        ? `${API_BASE_URL}/applications/${appId}/approve`
        : `${API_BASE_URL}/applications/${appId}/status`;

      const response = await fetch(`${API_BASE_URL}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to modify application state');
      
      setSelectedApp(null); 
      fetchUsers(); 
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans relative">
      <Link to="/" className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 transition">
        ← Back to {session?.user?.role === 'Admin' ? 'Admin' : 'Faculty'} Dashboard
      </Link>

      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">Review Student Applications</h1>
        <p className="text-sm text-slate-500 mt-1">Moderate student structural records and committee acceptance states.</p>

        {error && <div className="mt-4 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm font-semibold">{error}</div>}

        {loading ? (
          <div className="mt-8 text-center text-slate-500 font-medium animate-pulse">Loading assigned students...</div>
        ) : users.length === 0 ? (
          <div className="mt-8 text-center p-8 bg-slate-50 border border-dashed rounded-xl text-slate-400 font-medium">
            No registered student applications matching your operational clearance context.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse bg-white text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Roll Number / ID</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Target Organization</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {users.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700 uppercase">
                      {item.user?.Roll_Number || item.student?.Roll_Number || item.Roll_Number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {item.user?.full_name || item.student?.full_name || item.full_name || 'Student Applicant'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {item.organization?.name || item.organization_name || 'General Application Context'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        item.status === 'Accepted' || item.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        item.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        item.status === 'Seat Filled' ? 'bg-slate-50 text-slate-500 border border-slate-200' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {item.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedApp(item)}
                        className="bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-3 py-1.5 rounded-md text-xs font-bold transition border border-slate-200 hover:border-emerald-200"
                      >
                        View & Moderate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REFINED SIDEBAR DRAWER */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex justify-end drawer-panel-overlay">
          <div className="w-full max-w-md bg-white h-screen shadow-2xl p-6 flex flex-col justify-between border-l border-slate-200 drawer-content-card animate-slideLeft">
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Review Application Details</h2>
                  <p className="text-xs text-emerald-600 font-semibold tracking-wide uppercase mt-0.5">SIES Governance System Layer</p>
                </div>
                <button onClick={() => setSelectedApp(null)} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 space-y-5">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Full Legal Student Identity</span>
                  <span className="text-lg font-bold text-slate-800 block mt-1">
                    {selectedApp.user?.full_name || selectedApp.student?.full_name || selectedApp.full_name || 'N/A'}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Institutional Roll Number ID</span>
                  <span className="text-sm font-mono font-bold text-slate-700 block mt-1 uppercase">
                    {selectedApp.user?.Roll_Number || selectedApp.student?.Roll_Number || selectedApp.Roll_Number || 'N/A'}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Target Institutional Branch Scope</span>
                  <span className="text-sm font-bold text-slate-800 block mt-1">
                    {selectedApp.organization?.name || selectedApp.organization_name || 'General Campus Scope'}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <span className="text-xs font-bold text-slate-400 tracking-wider block">Current Status</span>
                  <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-full mt-2 bg-slate-200 text-slate-700">
                    {selectedApp.status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex gap-3">
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus(selectedApp._id, 'Rejected')}
                className="w-full inline-flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-3 px-4 rounded-xl transition text-sm border border-rose-200"
              >
                <AlertTriangle size={16} />
                Reject Profile
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus(selectedApp._id, 'Accepted')}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl transition text-sm shadow-sm"
              >
                <CheckCircle size={16} />
                Accept Student
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus(selectedApp._id, 'Pending')}
                className="w-full inline-flex items-center justify-center bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold py-3 px-4 rounded-xl transition text-sm border border-sky-200"
              >
                Reset to Pending
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;