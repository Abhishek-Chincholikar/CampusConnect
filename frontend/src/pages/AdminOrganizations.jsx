import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, X } from 'lucide-react';

// --- ✅ FIXED: Imports your central environment endpoint variable configuration ---
import { API_BASE_URL } from '../config.js';

function AdminOrganizations({ session }) {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [form, setForm] = useState({ 
    name: '', 
    type: 'Committee', 
    description: '',
    faculty_coordinator: '',
    max_capacity: '50' 
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  // --- ✅ FIXED: Fetches cleanly using your central production API url string ---
  const fetchOrgs = async () => {
    try {
      const token = window.localStorage.getItem('campusconnect_token');
      const response = await fetch(`${API_BASE_URL}/organizations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to fetch data');
      
      const rawData = body.data || [];
      const currentUserEmail = String(session?.user?.email || '').toLowerCase().trim();

      if (session?.user?.role === 'Faculty' && currentUserEmail === 'nehac@sies.edu.in') {
        const filteredData = rawData.filter(org => String(org.name).toUpperCase().includes('POSH'));
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

  // --- ✅ FIXED: Deletion endpoint calls route using the central configuration template variable ---
  const handleDelete = async (orgId) => {
    if (!window.confirm('Are you absolutely sure you want to disband this student organization body?')) return;
    try {
      const token = window.localStorage.getItem('campusconnect_token');
      const response = await fetch(`${API_BASE_URL}/organizations/${orgId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Deletion task failed');
      setOrganizations((prev) => prev.filter((o) => o._id !== orgId));
    } catch (err) {
      alert(err.message);
    }
  };

  // --- ✅ FIXED: Creation endpoint calls route using the central configuration template variable ---
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    
    const fixedPayload = {
      ...form,
      max_capacity: Number(form.max_capacity)
    };

    try {
      const token = window.localStorage.getItem('campusconnect_token');
      const response = await fetch(`${API_BASE_URL}/organizations/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fixedPayload)
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to provision organization');
      
      setIsModalOpen(false);
      setForm({ name: '', type: 'Committee', description: '', faculty_coordinator: '', max_capacity: '50' });
      fetchOrgs(); 
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        <Link to="/" className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 transition">
          ← Back to {session?.user?.role === 'Admin' ? 'Admin' : 'Faculty'} Dashboard
        </Link>
        
        {session?.user?.role === 'Admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-semibold text-sm transition shadow-sm"
          >
            <Plus size={16} />
            Provision Organization
          </button>
        )}
      </div>

      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">Manage Clubs & Committees</h1>
        <p className="text-sm text-slate-500 mt-1">View, provision, or disband structural campus student bodies.</p>

        {error && <div className="mt-4 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm font-semibold">{error}</div>}

        {loading ? (
          <div className="mt-8 text-center text-slate-500 font-medium animate-pulse">Loading institutional records...</div>
        ) : organizations.length === 0 ? (
          <div className="mt-8 text-center p-8 bg-slate-50 border border-dashed rounded-xl text-slate-400 font-medium">
            No dynamic organizations registered in database collections.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse bg-white text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Classification</th>
                  <th className="px-6 py-4">Coordinator Address</th>
                  <th className="px-6 py-4 text-center">Max Capacity</th>
                  {session?.user?.role === 'Admin' && <th className="px-6 py-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {organizations.map((org) => (
                  <tr key={org._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{org.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        org.type === 'Committee' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {org.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{org.faculty_coordinator || 'Not Assigned'}</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-800">{org.max_capacity ?? 'N/A'}</td>
                    
                    {session?.user?.role === 'Admin' && (
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDelete(org._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-xl font-bold text-slate-900">New Organization Profile</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full h-11 border border-slate-300 rounded-lg px-3 text-sm outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Classification Scope</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({...form, type: e.target.value})}
                  className="w-full h-11 border border-slate-300 bg-white rounded-lg px-3 text-sm outline-none focus:border-emerald-600"
                >
                  <option value="Committee">Committee (Academic Council)</option>
                  <option value="Club">Club (General Activity Cluster)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Faculty Coordinator Reference Email</label>
                <input
                  type="text"
                  required
                  value={form.faculty_coordinator}
                  onChange={(e) => setForm({...form, faculty_coordinator: e.target.value})}
                  className="w-full h-11 border border-slate-300 rounded-lg px-3 text-sm outline-none focus:border-emerald-600 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Maximum Enrollment Capacity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.max_capacity}
                  onChange={(e) => setForm({...form, max_capacity: e.target.value})}
                  className="w-full h-11 border border-slate-300 rounded-lg px-3 text-sm outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none resize-none focus:border-emerald-600"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={submitLoading} className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm">{submitLoading ? 'Provisioning...' : 'Confirm Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrganizations;