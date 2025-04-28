import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminNavigation: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <div className="mb-6 bg-gray-100 p-4 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Admin Navigation</h2>
      <div className="flex flex-wrap gap-2">
        <Link 
          to="/admin"
          className={`px-4 py-2 rounded ${isActive('/admin') ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-200'}`}
        >
          User Management
        </Link>
        <Link 
          to="/admin/default-schedule"
          className={`px-4 py-2 rounded ${isActive('/admin/default-schedule') ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-200'}`}
        >
          Default Schedules
        </Link>
        <Link 
          to="/admin/supplemental-workouts"
          className={`px-4 py-2 rounded ${isActive('/admin/supplemental-workouts') ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-200'}`}
        >
          Supplemental Workouts
        </Link>
      </div>
    </div>
  );
};

export default AdminNavigation;