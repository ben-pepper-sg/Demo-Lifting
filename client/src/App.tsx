import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import SchedulePage from './pages/SchedulePage';
import DefaultSchedulePage from './pages/DefaultSchedulePage';
import ProfilePage from './pages/ProfilePage';
import ClassViewPage from './pages/ClassViewPage';
import LiftingClassPage from './pages/LiftingClassPage';
import AdminPage from './pages/AdminPage';
import DefaultScheduleAdminPage from './pages/DefaultScheduleAdminPage';
import SupplementalWorkoutAdminPage from './pages/SupplementalWorkoutAdminPage';
import LiftProgressPage from './pages/LiftProgressPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password/:token" element={<ResetPasswordPage />} />
          
          {/* Protected routes */}
          <Route path="dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="schedule" element={
            <ProtectedRoute>
              <DefaultSchedulePage />
            </ProtectedRoute>
          } />
          <Route path="schedule/old" element={
            <ProtectedRoute>
              <SchedulePage />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="progress" element={
            <ProtectedRoute>
              <LiftProgressPage />
            </ProtectedRoute>
          } />
          
          {/* Class views */}
          <Route path="class" element={<ClassViewPage />} />
          <Route path="lifting-class" element={<LiftingClassPage />} />
          
          {/* Admin routes */}
          <Route path="admin" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />
          <Route path="admin/default-schedule" element={
            <AdminRoute>
              <DefaultScheduleAdminPage />
            </AdminRoute>
          } />
          <Route path="admin/supplemental-workouts" element={
            <AdminRoute>
              <SupplementalWorkoutAdminPage />
            </AdminRoute>
          } />
          </Route>
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;