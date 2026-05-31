import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

function AdminReports() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    const token =
      localStorage.getItem(
        'campusconnect_token'
      );

    const formData =
      new FormData();

    formData.append(
      'title',
      title
    );

    formData.append(
      'pdf',
      file
    );

    const response =
      await fetch(
        `${API_BASE_URL}/reports/upload`,
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          body: formData,
        }
      );

   const data = await response.json();

        if (response.ok) {
            alert('Report uploaded successfully');
            setTitle('');
            setFile(null);
        } else {
            alert(data.message || 'Upload failed');
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
        PDF Reports
      </h1>

      <input
        type="text"
        placeholder="Report Title"
        value={title}
        onChange={(e) =>
          setTitle(e.target.value)
        }
        className="border p-2 w-full mt-6"
      />

      <input
        type="file"
        accept=".pdf"
        onChange={(e) =>
          setFile(
            e.target.files[0]
          )
        }
        className="mt-4"
      />

      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
      >
        Upload PDF
      </button>

    </div>
  );
}

export default AdminReports;