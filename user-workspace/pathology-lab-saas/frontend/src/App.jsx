import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserList from './pages/users/UserList';
import CreateUser from './pages/users/CreateUser';
import EditUser from './pages/users/EditUser';

import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout Components
const DashboardLayout = lazy(() => import('./components/layouts/DashboardLayout'));
const AuthLayout = lazy(() => import('./components/layouts/AuthLayout'));

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));

// Dashboard Pages
const SuperAdminDashboard = lazy(() => import('./pages/dashboard/SuperAdminDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));
const LabTechnicianDashboard = lazy(() => import('./pages/dashboard/LabTechnicianDashboard'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Reports = lazy(() => import('./pages/reports/Reports'));
const CreateReport = lazy(() => import('./pages/reports/CreateReport'));
const ViewReport = lazy(() => import('./pages/reports/ViewReport'));
const LabSettings = lazy(() => import('./pages/settings/LabSettings'));
const UserManagement = lazy(() => import('./pages/settings/UserManagement'));

// Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/lab-technician" element={<LabTechnicianDashboard />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* User Management Routes */}
            <Route element={
              <ProtectedRoute>
                <UserList />
              </ProtectedRoute>
            }>
              <Route path="/users" element={<UserList />} />
              <Route path="/users/create" element={<CreateUser />} />
              <Route path="/users/:id" element={<EditUser />} />
            </Route>

            {/* Protected Routes */}
            <Route element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/create" element={<CreateReport />} />
              <Route path="/reports/:id" element={<ViewReport />} />
              <Route path="/settings/lab" element={<LabSettings />} />
              <Route path="/settings/users" element={<UserManagement />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
