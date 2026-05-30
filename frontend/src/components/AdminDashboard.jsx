import React from 'react';

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

        <div className="border p-4 rounded">
          Manage Users
        </div>

        <div className="border p-4 rounded">
          Announcements
        </div>

        <div className="border p-4 rounded">
          PDF Reports
        </div>

        <div className="border p-4 rounded">
          Organizations
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;