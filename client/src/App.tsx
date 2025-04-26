import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SchedulePage from './pages/SchedulePage';
import ProfilePage from './pages/ProfilePage';
import ClassViewPage from './pages/ClassViewPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route path="dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="schedule" element={
            <ProtectedRoute>
              <SchedulePage />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Class view */}
          <Route path="class" element={<ClassViewPage />} />
          
          {/* Admin routes */}
          <Route path="admin" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;