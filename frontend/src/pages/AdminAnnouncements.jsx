import { Link } from 'react-router-dom';

function AdminAnnouncements() {
  return (
    <div className="p-8">

      <Link
        to="/"
        className="text-blue-600 font-semibold"
      >
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mt-4">
        Announcements
      </h1>

    </div>
  );
}

export default AdminAnnouncements;