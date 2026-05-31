import React from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard({ session, onLogout }) {

  return (
    <div className="p-8">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Admin Dashboard
          </h1>
          <p>
            Welcome {session.user.full_name}
          </p>
        </div>

        <button
          onClick={onLogout}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-8">
        <Link to="/admin/users" className="border p-4 rounded block hover:bg-slate-100">
          Manage Users
        </Link>
        <Link to="/admin/announcements" className="border p-4 rounded block hover:bg-slate-100">
          Announcements
        </Link>
        <Link to="/admin/reports" className="border p-4 rounded block hover:bg-slate-100">
          PDF Reports
        </Link>
        <Link to="/admin/organizations" className="border p-4 rounded block hover:bg-slate-100">
          Organizations
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;