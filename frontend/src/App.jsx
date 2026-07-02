import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import HostelAllocation from './pages/HostelAllocation';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentQuiz from './pages/student/StudentQuiz';
import StudentPreferences from './pages/student/StudentPreferences';
import StudentComplaints from './pages/student/StudentComplaints';
import StudentSwap from './pages/student/StudentSwap';

// Guard for authenticated routes
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect students to dashboard, and admins to overview dashboard if unauthorized
    if (user.role === 'Student') {
      return <Navigate to="/student/dashboard" replace />;
    } else {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Guarded Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SuperAdmin', 'HostelAdmin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/allocation"
            element={
              <ProtectedRoute allowedRoles={['SuperAdmin', 'HostelAdmin']}>
                <HostelAllocation />
              </ProtectedRoute>
            }
          />

          {/* Student Guarded Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/quiz"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <StudentQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/preferences"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <StudentPreferences />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/complaints"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <StudentComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/swap"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <StudentSwap />
              </ProtectedRoute>
            }
          />

          {/* Redirect fallbacks */}
          <Route path="/student/portal" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
