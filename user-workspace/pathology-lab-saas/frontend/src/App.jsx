import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserList from './pages/users/UserList';
import CreateUser from './pages/users/CreateUser';
import EditUser from './pages/users/EditUser';
import CreateLab from './pages/labs/CreateLab';

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

// Report Pages
const Reports = lazy(() => import('./pages/reports/Reports'));
const CreateReport = lazy(() => import('./pages/reports/CreateReport'));
const ViewReport = lazy(() => import('./pages/reports/ViewReport'));
const EditReport = lazy(() => import('./pages/reports/EditReport'));
const PrintReport = lazy(() => import('./pages/reports/PrintReport'));

// Patient Pages
const PatientList = lazy(() => import('./pages/patients/PatientList'));
const AddPatient = lazy(() => import('./pages/patients/AddPatient'));
const EditPatient = lazy(() => import('./pages/patients/EditPatient'));

// Settings Pages
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
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>
            
            {/* Dashboard Routes */}
            <Route element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard/super-admin" element={
                <ProtectedRoute allowedRoles={['super-admin']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin" element={
                <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/lab-technician" element={
                <ProtectedRoute allowedRoles={['technician', 'admin', 'super-admin']}>
                  <LabTechnicianDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            {/* Lab Management Routes */}
            <Route element={
              <ProtectedRoute allowedRoles={['super-admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/labs/create" element={<CreateLab />} />
            </Route>

            {/* User Management Routes */}
            <Route element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/users" element={<UserList />} />
              <Route path="/users/create" element={
                <ProtectedRoute allowedRoles={['super-admin', 'admin']}>
                  <CreateUser />
                </ProtectedRoute>
              } />
              <Route path="/users/:id" element={<EditUser />} />
            </Route>

            {/* Protected Routes */}
            <Route element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              {/* Dashboard Routes - Redirect to role-specific dashboard */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Report Routes */}
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/create" element={<CreateReport />} />
              <Route path="/reports/:id" element={<ViewReport />} />
              <Route path="/reports/:id/edit" element={<EditReport />} />
              <Route path="/reports/:id/print" element={<PrintReport />} />
              
              {/* Patient Routes */}
              <Route path="/patients" element={<PatientList />} />
              <Route path="/patients/add" element={<AddPatient />} />
              <Route path="/patients/:id/edit" element={<EditPatient />} />
              <Route path="/patients/:id" element={<Navigate to="/patients/:id/edit" replace />} />
              
              {/* Settings Routes */}
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
