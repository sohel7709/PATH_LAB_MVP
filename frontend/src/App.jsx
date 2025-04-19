import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserList from './pages/users/UserList';
import CreateUser from './pages/users/CreateUser';
import EditUser from './pages/users/EditUser';
import CreateLab from './pages/labs/CreateLab';
import LabList from './pages/labs/LabList';
import LabListDebug from './pages/labs/LabListDebug';
import LabDetail from './pages/labs/LabDetail';
import EditLab from './pages/labs/EditLab';
import Profile from './pages/profile/Profile';
import Inventory from './pages/inventory';
import FinancialReports from './pages/finance/reports';
import DoctorList from './pages/doctors/DoctorList';
import AddDoctor from './pages/doctors/AddDoctor';
import EditDoctor from './pages/doctors/EditDoctor';

import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout Components
const DashboardLayout = lazy(() => import('./components/layouts/DashboardLayout'));
const AuthLayout = lazy(() => import('./components/layouts/AuthLayout'));

// Auth Pages
const Login = lazy(() => import('./pages/auth/ImprovedLogin'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPasswordWrapper'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPasswordWrapper'));

import ComingSoon from './pages/ComingSoon';
import UserIntelligence from './pages/UserIntelligence';

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

// Test Template Pages
const TestTemplateList = lazy(() => import('./pages/templates/TestTemplateList'));
const CreateTestTemplate = lazy(() => import('./pages/templates/CreateTestTemplate'));
const ViewTestTemplate = lazy(() => import('./pages/templates/ViewTestTemplate'));
const EditTestTemplate = lazy(() => import('./pages/templates/EditTestTemplate'));

// Patient Pages
const PatientList = lazy(() => import('./pages/patients/PatientList'));
const AddPatient = lazy(() => import('./pages/patients/AddPatient'));
const EditPatient = lazy(() => import('./pages/patients/EditPatient'));

// Settings Pages
const LabSettings = lazy(() => import('./pages/settings/LabSettings'));
const UserManagement = lazy(() => import('./pages/settings/UserManagement'));
const ReportSettings = lazy(() => import('./pages/settings/ReportSettings'));
const NotificationSettings = lazy(() => import('./pages/settings/NotificationSettings'));
const PlanManagement = lazy(() => import('./pages/plans/PlanManagement')); // Import Plan Management page

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
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
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
              <Route path="/labs" element={<LabList />} />
              <Route path="/labs/create" element={<CreateLab />} />
              <Route path="/labs/:id" element={<LabDetail />} />
              <Route path="/labs/:id/edit" element={<EditLab />} />
              <Route path="/lab-management" element={<Navigate to="/labs" replace />} />
              {/* Plan Management Route (Super Admin only) */}
              <Route path="/plans" element={
                <ProtectedRoute allowedRoles={['super-admin']}>
                  <PlanManagement />
                </ProtectedRoute>
              } />
              {/* User Intelligence Route (Super Admin only) */}
              <Route path="/user-intelligence" element={
                <ProtectedRoute allowedRoles={['super-admin']}>
                  <UserIntelligence />
                </ProtectedRoute>
              } />
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
              
              {/* Test Template Routes */}
              <Route path="/templates" element={<TestTemplateList />} />
              <Route path="/templates/:id" element={<ViewTestTemplate />} />
              <Route path="/templates/create" element={
                <ProtectedRoute allowedRoles={['super-admin']}>
                  <CreateTestTemplate />
                </ProtectedRoute>
              } />
              <Route path="/templates/:id/edit" element={
                <ProtectedRoute allowedRoles={['super-admin']}>
                  <EditTestTemplate />
                </ProtectedRoute>
              } />
              
              {/* Patient Routes */}
              <Route path="/patients" element={<PatientList />} />
              <Route path="/patients/add" element={<AddPatient />} />
              <Route path="/patients/:id/edit" element={<EditPatient />} />
              <Route path="/patients/:id" element={<Navigate to="/patients/:id/edit" replace />} />
              
              {/* Doctor Routes */}
              <Route path="/doctors" element={
                <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                  <DoctorList />
                </ProtectedRoute>
              } />
              <Route path="/doctors/add" element={
                <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                  <AddDoctor />
                </ProtectedRoute>
              } />
              <Route path="/doctors/edit/:id" element={
                <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                  <EditDoctor />
                </ProtectedRoute>
              } />
              
              {/* Settings Routes */}
              <Route path="/settings/lab" element={<LabSettings />} />
              <Route path="/settings/users" element={<UserManagement />} />
              <Route path="/settings/reports" element={<ReportSettings />} />
              <Route path="/settings/notifications" element={
                <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                  <NotificationSettings />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={<Profile />} />
              
              {/* Coming Soon Feature Pages */}
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/finance/reports" element={<FinancialReports />} />
              <Route path="/samples" element={<ComingSoon />} />
              <Route path="/tasks" element={<ComingSoon />} />
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
