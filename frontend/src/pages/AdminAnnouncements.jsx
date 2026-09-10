import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config.js';

function AdminAnnouncements() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !content) return alert("Title and content are required.");
    setLoading(true);

    try {
      const token = localStorage.getItem('campusconnect_token');
      const response = await fetch(`${API_BASE_URL}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      const data = await response.json();

      if (response.ok) {
        setTitle('');
        setContent('');
        alert('Announcement posted successfully!');
      } else {
        alert(data.message || 'Failed to post announcement');
      }
    } catch (error) {
      alert("Network error occurred.");
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
            Publish Announcement
          </h1>
          <p className="text-sm text-slate-500 mb-8">
            Broadcast a global notice to all student dashboards.
          </p>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Announcement Title</label>
              <input
                type="text"
                placeholder="e.g., Upcoming Hackathon Registration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 border border-slate-300 rounded-xl px-4 text-sm outline-none focus:border-institute-blue focus:ring-1 focus:ring-institute-blue transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Message Body</label>
              <textarea
                placeholder="Enter the full details of the notice..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-48 border border-slate-300 rounded-xl p-4 text-sm outline-none resize-none focus:border-institute-blue focus:ring-1 focus:ring-institute-blue transition-all"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-institute-navy hover:bg-institute-blue text-white font-bold h-12 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Post Announcement'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminAnnouncements;