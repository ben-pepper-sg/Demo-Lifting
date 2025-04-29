import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome, {user?.firstName}!</h2>
          <p className="text-gray-600 mb-4">
            Your TFW MMA lifting program dashboard helps you stay on track with your training. 
            Here's what you can do:
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Your Profile</h3>
                <p className="text-sm text-gray-500">View your max lifts and today's workout scheme</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Schedule</h3>
                <p className="text-sm text-gray-500">Book or view your upcoming classes</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Progress Tracking</h3>
                <p className="text-sm text-gray-500">Track your lifting progress over time</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="card p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Quick Links</h2>
            <div className="space-y-3">
              <Link to="/profile" className="btn-primary w-full block text-center">View Profile & Program</Link>
              <Link to="/schedule" className="btn-primary w-full block text-center">Schedule Classes</Link>
              <Link to="/progress" className="btn-primary w-full block text-center">View Progress</Link>
              <Link to="/class" className="btn-primary w-full block text-center">Current Class</Link>
            </div>
          </div>
          
          <div className="card p-6 bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">Today's Focus</h2>
            <p className="text-gray-600 mb-4">
              {new Date().getDay() % 2 === 0 ? 'Lower Body Day' : 'Upper Body Day'}
            </p>
            <p className="text-gray-600">
              Check your profile to see your personalized workout for today.  
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;