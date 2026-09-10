import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, X, RotateCcw, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config.js';

function AdminOrganizations({ session }) {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Organization Creation State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Committee', description: '', faculty_coordinator: '', max_capacity: '50' });
  const [submitLoading, setSubmitLoading] = useState(false);

  // Leadership Assignment State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [roleForm, setRoleForm] = useState({ studentEmail: '', customTitle: '', grantModeration: true });
  const [roleLoading, setRoleLoading] = useState(false);
  
  // Undo Deletion State
  const [lastDeletedOrg, setLastDeletedOrg] = useState(null);
  const [showUndoBanner, setShowUndoBanner] = useState(false);

  const fetchOrgs = async () => {
    try {
      const token = window.localStorage.getItem('campusconnect_token');
      const response = await fetch(`${API_BASE_URL}/organizations`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to fetch data');
      
      const rawData = body.data || [];
      const currentUserEmail = String(session?.user?.email || '').toLowerCase().trim();

      if (session?.user?.role === 'Faculty') {
        const filteredData = rawData.filter(org => {
          const coordinatorEmail = String(org.faculty_coordinator || '').toLowerCase().trim();
          return coordinatorEmail === currentUserEmail;
        });
        setOrganizations(filteredData);
      } else {
        setOrganizations(rawData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, [session]);

  const handleDelete = async (orgId) => {
    if (!window.confirm('Are you absolutely sure you want to disband this student body?')) return;
    try {
      const token = window.localStorage.getItem('campusconnect_token');
      const response = await fetch(`${API_BASE_URL}/organizations/${orgId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Deletion task failed');
      
      const deletedItem = organizations.find(o => o._id === orgId);
      setLastDeletedOrg(deletedItem);
      setShowUndoBanner(true);
      
      setOrganizations((prev) => prev.filter((o) => o._id !== orgId));
      setTimeout(() => setShowUndoBanner(false), 10000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedOrg) return;
    try {
      const token = window.localStorage.getItem('campusconnect_token');
      const response = await fetch(`${API_BASE_URL}/organizations/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lastDeletedOrg.name,
          type: lastDeletedOrg.type,
          description: lastDeletedOrg.description,
          faculty_coordinator: lastDeletedOrg.faculty_coordinator,
          max_capacity: lastDeletedOrg.max_capacity
        })
      });
      if (!response.ok) throw new Error('Failed to restore record');
      
      setShowUndoBanner(false);
      setLastDeletedOrg(null);
      fetchOrgs(); 
      alert('Committee/Club restored successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    const fixedPayload = { ...form, max_capacity: Number(form.max_capacity) };

    try {
      const token = window.localStorage.getItem('campusconnect_token');
      const response = await fetch(`${API_BASE_URL}/organizations/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(fixedPayload)
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to provision record');
      
      setIsModalOpen(false);
      setForm({ name: '', type: 'Committee', description: '', faculty_coordinator: '', max_capacity: '50' });
      fetchOrgs(); 
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setRoleLoading(true);
    setError('');

    try {
      const token = window.localStorage.getItem('campusconnect_token');
      const response = await fetch(`${API_BASE_URL}/admin/assign-leadership`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentEmail: roleForm.studentEmail,
          organizationId: selectedOrg._id,
          customTitle: roleForm.customTitle,
          grantModeration: roleForm.grantModeration
        })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to assign role');

      setIsRoleModalOpen(false);
      setRoleForm({ studentEmail: '', customTitle: '', grantModeration: true });
      alert(body.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setRoleLoading(false);
    }
  };

  const openRoleModal = (org) => {
    setSelectedOrg(org);
    setError('');
    setIsRoleModalOpen(true);
  };

  return (
    <div className="p-6 md:p-8 bg-institute-mist min-h-screen font-sans relative">
      <AnimatePresence>
        {showUndoBanner && lastDeletedOrg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 bg-slate-900 text-white px-5 py-4 rounded-xl shadow-xl z-50 flex items-center gap-4 border border-slate-700 max-w-sm"
          >
            <div>
              <p className="text-sm font-semibold">Disbanded "{lastDeletedOrg.name}"</p>
              <p className="text-xs text-slate-400 mt-0.5">You can revert this operational task right now.</p>
            </div>
            <button 
              onClick={handleUndoDelete}
              className="bg-institute-blue hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw size={13} />
              Undo Action
            </button>
            <button onClick={() => setShowUndoBanner(false)} className="text-slate-400 hover:text-white transition pl-1">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center max-w-6xl mx-auto mb-8">
        <Link to="/" className="text-institute-blue hover:text-blue-800 font-bold flex items-center gap-2 transition">
          ← Back to Dashboard
        </Link>
        
        {session?.user?.role === 'Admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-institute-navy hover:bg-institute-blue text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={18} />
            Provision Committee/Club
          </button>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm max-w-6xl mx-auto"
      >
        <h1 className="text-3xl font-extrabold text-institute-ink">Manage Clubs & Committees</h1>
        <p className="text-sm text-slate-500 mt-2">View, provision, or disband structural campus student bodies.</p>

        {error && <div className="mt-6 p-4 bg-cardinal-50 text-cardinal-700 rounded-xl text-sm font-semibold border border-cardinal-200">{error}</div>}

        {loading ? (
          <div className="mt-8 text-center text-institute-blue font-bold animate-pulse py-12">Loading institutional records...</div>
        ) : organizations.length === 0 ? (
          <div className="mt-8 text-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-500 font-medium">
            No active committees/clubs registered in database collections.
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse bg-white text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Classification</th>
                  <th className="px-6 py-4">Coordinator Email</th>
                  <th className="px-6 py-4 text-center">Max Capacity</th>
                  {session?.user?.role === 'Admin' && <th className="px-6 py-4 text-right pr-8">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {organizations.map((org) => (
                  <tr key={org._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{org.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                        org.type === 'Committee' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {org.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{org.faculty_coordinator || 'Not Assigned'}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{org.max_capacity ?? 'N/A'}</td>
                    
                    {session?.user?.role === 'Admin' && (
                      <td className="px-6 py-4 text-right pr-6 space-x-2">
                        <button
                          onClick={() => openRoleModal(org)}
                          className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-institute-blue hover:bg-blue-50 rounded-lg transition-all"
                          title="Assign Leadership/POC"
                        >
                          <UserPlus size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(org._id)}
                          className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-cardinal-600 hover:bg-cardinal-50 rounded-lg transition-all"
                          title="Disband Record"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* CREATION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <h2 className="text-xl font-extrabold text-institute-ink">New Committee/Club</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Committee/Club Name</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full h-12 border border-slate-300 rounded-xl px-4 text-sm outline-none focus:border-institute-blue focus:ring-1 focus:ring-institute-blue transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Classification Scope</label>
                  <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full h-12 border border-slate-300 bg-white rounded-xl px-4 text-sm outline-none focus:border-institute-blue focus:ring-1 focus:ring-institute-blue transition-all">
                    <option value="Committee">Committee (Academic Council)</option>
                    <option value="Club">Club (General Activity Cluster)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Faculty Coordinator Email</label>
                  <input type="text" required value={form.faculty_coordinator} onChange={(e) => setForm({...form, faculty_coordinator: e.target.value})} className="w-full h-12 border border-slate-300 rounded-xl px-4 text-sm outline-none focus:border-institute-blue focus:ring-1 focus:ring-institute-blue font-mono transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Maximum Enrollment Capacity</label>
                  <input type="number" required min="1" value={form.max_capacity} onChange={(e) => setForm({...form, max_capacity: e.target.value})} className="w-full h-12 border border-slate-300 rounded-xl px-4 text-sm outline-none focus:border-institute-blue focus:ring-1 focus:ring-institute-blue transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Description</label>
                  <textarea required rows={3} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full border border-slate-300 rounded-xl p-4 text-sm outline-none resize-none focus:border-institute-blue focus:ring-1 focus:ring-institute-blue transition-all" />
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors">Cancel</button>
                  <button type="submit" disabled={submitLoading} className="px-5 py-2.5 bg-institute-navy hover:bg-institute-blue text-white font-bold rounded-xl text-sm shadow-md transition-all">
                    {submitLoading ? 'Provisioning...' : 'Confirm Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEADERSHIP ASSIGNMENT MODAL */}
      <AnimatePresence>
        {isRoleModalOpen && selectedOrg && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-institute-ink">Assign Leadership</h2>
                  <p className="text-xs text-institute-blue font-bold mt-1 uppercase">{selectedOrg.name}</p>
                </div>
                <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRoleSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Student Institutional Email</label>
                  <input type="email" required placeholder="e.g., student.mca25@siescoms.sies.edu.in" value={roleForm.studentEmail} onChange={(e) => setRoleForm({...roleForm, studentEmail: e.target.value})} className="w-full h-12 border border-slate-300 rounded-xl px-4 text-sm outline-none focus:border-institute-blue focus:ring-1 focus:ring-institute-blue font-mono transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Custom Title / Role Name</label>
                  <input type="text" required placeholder="e.g., MCA Point of Contact" value={roleForm.customTitle} onChange={(e) => setRoleForm({...roleForm, customTitle: e.target.value})} className="w-full h-12 border border-slate-300 rounded-xl px-4 text-sm outline-none focus:border-institute-blue focus:ring-1 focus:ring-institute-blue transition-all" />
                </div>
                
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="grantMod" 
                    checked={roleForm.grantModeration} 
                    onChange={(e) => setRoleForm({...roleForm, grantModeration: e.target.checked})}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-institute-blue focus:ring-institute-blue"
                  />
                  <label htmlFor="grantMod" className="text-sm font-medium text-slate-700 cursor-pointer">
                    <strong className="block text-institute-ink mb-0.5">Grant Application Review Access</strong>
                    Allows this student to accept, reject, and moderate candidates applying to this specific committee.
                  </label>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors">Cancel</button>
                  <button type="submit" disabled={roleLoading} className="px-5 py-2.5 bg-institute-blue hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all">
                    {roleLoading ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminOrganizations;