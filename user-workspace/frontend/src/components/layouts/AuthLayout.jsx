import { Outlet, useLocation } from 'react-router-dom';
import ImprovedLogin from '../../pages/auth/ImprovedLogin';

export default function AuthLayout() {
  const location = useLocation();
  
  // Check if the current route is a login page
  const isLoginPage = location.pathname === '/login';
  // Check if the current route is a forgot password or reset password page
  const isForgotPasswordPage = location.pathname === '/forgot-password' || location.pathname.startsWith('/reset-password/');
  
  if (isLoginPage) {
    return <ImprovedLogin />;
  }
  
  if (isForgotPasswordPage) {
    return <Outlet />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            className="mx-auto h-12 w-auto"
            src="/logo.svg"
            alt="Pathology Lab"
          />
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <Outlet />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Pathology Lab. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
