import React, { useState } from 'react';

function AdminDashboard({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('users');

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
        <button onClick={() => setActiveTab('users')} className="border p-4 rounded text-left hover:bg-slate-100">
          Manage Users
        </button>
        <button onClick={() => setActiveTab('announcements')} className="border p-4 rounded text-left hover:bg-slate-100">
          Announcements
        </button>
        <button onClick={() => setActiveTab('reports')} className="border p-4 rounded text-left hover:bg-slate-100">
          PDF Reports
        </button>
        <button onClick={() => setActiveTab('organizations')} className="border p-4 rounded text-left hover:bg-slate-100">
          Organizations
        </button>
      </div>
      <div className="mt-8 border rounded p-6 bg-white">
        {activeTab === 'users' && (
          <>
            <h2 className="text-2xl font-bold mb-4">
              User Management
            </h2>
            <p>
              Promote Students to Head or Faculty.
            </p>
          </>
        )}
        {activeTab === 'announcements' && (
          <>
            <h2 className="text-2xl font-bold mb-4">
              Announcements
            </h2>
            <p>
              Create and manage announcements.
            </p>
          </>
        )}
        {activeTab === 'reports' && (
          <>
            <h2 className="text-2xl font-bold mb-4">
              PDF Reports
            </h2>
            <p>
              Upload and manage reports.
            </p>
          </>
        )}
        {activeTab === 'organizations' && (
          <>
            <h2 className="text-2xl font-bold mb-4">
              Organizations
            </h2>
            <p>
              Create Clubs and Committees.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;