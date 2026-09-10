import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';

function AdminReports({ session }) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [organizationId, setOrganizationId] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('campusconnect_token');
    fetch(`${API_BASE_URL}/organizations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        const rawData = data.data || [];
        const userRole = session?.user?.role;
        const currentUserEmail = String(session?.user?.email || '').toLowerCase().trim();

        if (userRole === 'Faculty') {
          const myOrgs = rawData.filter(org => {
            const coordinatorEmail = String(org.faculty_coordinator || '').toLowerCase().trim();
            return coordinatorEmail === currentUserEmail;
          });
          setOrganizations(myOrgs);
        } else {
          setOrganizations(rawData);
        }
      });
  }, [session]);

  const handleUpload = async () => {
    if (!title || !file || !organizationId) return alert("Please fill all fields and select a PDF.");
    setLoading(true);

    try {
      const token = localStorage.getItem('campusconnect_token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('pdf', file);
      formData.append('organization', organizationId);

      const response = await fetch(`${API_BASE_URL}/reports/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert('Report uploaded successfully!');
        setTitle('');
        setFile(null);
        setOrganizationId('');
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      alert("Network error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-institute-mist p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-institute-blue hover:text-blue-800 font-bold flex items-center gap-2 mb-8 transition">
          ← Back to Dashboard
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-sm"
        >
          <h1 className="text-3xl font-extrabold text-institute-ink mb-2">
            Upload PDF Report
          </h1>
          <p className="text-sm text-slate-500 mb-8">
            Submit activity reports or audit logs for a specific committee/club.
          </p>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Report Title</label>
              <input
                type="text"
                placeholder="e.g., Q3 Activity Summary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 border border-slate-300 rounded-xl px-4 text-sm outline-none focus:border-institute-blue focus:ring-1 focus:ring-institute-blue transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Target Committee/Club</label>
              <select 
                value={organizationId} 
                onChange={(e) => setOrganizationId(e.target.value)}
                className="w-full h-12 border border-slate-300 bg-white rounded-xl px-4 text-sm outline-none focus:border-institute-blue focus:ring-1 focus:ring-institute-blue transition-all"
              >
                <option value="">Select a Committee/Club...</option>
                {organizations.map(org => (
                  <option key={org._id} value={org._id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Document (PDF Only)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-institute-blue transition-colors bg-slate-50">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-institute-blue hover:file:bg-blue-100 transition-all cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={loading}
              className="w-full bg-institute-navy hover:bg-institute-blue text-white font-bold h-12 rounded-xl transition-all shadow-md hover:shadow-lg mt-4 disabled:opacity-50"
            >
              {loading ? 'Uploading File...' : 'Upload PDF Document'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminReports;