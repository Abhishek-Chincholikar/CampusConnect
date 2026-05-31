import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config.js';

function AdminAnnouncements() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    const token = localStorage.getItem(
      'campusconnect_token'
    );

    const response = await fetch(
      `${API_BASE_URL}/announcements`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
        }),
      }
    );

    const data = await response.json();

        if (response.ok) {
            setTitle('');
            setContent('');
            alert('Announcement posted successfully');
        } else {
            alert(data.message || 'Failed to post announcement');
        }
  };

  return (
    <div className="p-8">

      <Link
        to="/"
        className="text-blue-600"
      >
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mt-4">
        Announcements
      </h1>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) =>
          setTitle(e.target.value)
        }
        className="border p-2 w-full mt-6"
      />

      <textarea
        placeholder="Content"
        value={content}
        onChange={(e) =>
          setContent(e.target.value)
        }
        className="border p-2 w-full h-40 mt-4"
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
      >
        Post Announcement
      </button>

    </div>
  );
}

export default AdminAnnouncements;