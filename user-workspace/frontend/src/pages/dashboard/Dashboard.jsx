import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner, { SkeletonLoader } from "../../components/common/LoadingSpinner";
import {
  DocumentTextIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// dashboard
const stats = [
  { name: "Total Reports", icon: DocumentTextIcon },
  { name: "Active Users", icon: UserGroupIcon },
  { name: "Reports Today", icon: ClockIcon },
  { name: "Completion Rate", icon: ChartBarIcon },
];

const recentReports = [
  {
    id: 1,
    patientName: "John Smith",
    testName: "Blood Test",
    status: "completed",
    date: "2023-03-29",
  },
  // Add more sample data as needed
];

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    totalReports: 0,
    activeUsers: 0,
    reportsToday: 0,
    completionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [animateElements, setAnimateElements] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    setAnimateElements(true);
    
    // Simulate initial page loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsDataLoading(true);
        // Import API utilities
        const { dashboard } = await import('../../utils/api');
        
        // Fetch dashboard stats
        const data = await dashboard.getStats();
        
        setDashboardStats({
          totalReports: data.totalReports || 0,
          activeUsers: data.activeUsers || 0,
          reportsToday: data.reportsToday || 0,
          completionRate: data.completionRate || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Set default values when API call fails
        setDashboardStats({
          totalReports: 0,
          activeUsers: 0,
          reportsToday: 0,
          completionRate: 0,
        });
      } finally {
        // Add a small delay to ensure animations look smooth
        setTimeout(() => {
          setIsDataLoading(false);
        }, 500);
      }
    };

    // Only fetch data after initial loading animation completes
    if (!isLoading) {
      fetchDashboardData();
    }
  }, [isLoading]);

  const getStatValue = (statName) => {
    switch (statName) {
      case "Total Reports":
        return dashboardStats.totalReports;
      case "Active Users":
        return dashboardStats.activeUsers;
      case "Reports Today":
        return dashboardStats.reportsToday;
      case "Completion Rate":
        return `${dashboardStats.completionRate}%`;
      default:
        return 0;
    }
  };

  // Show loading spinner while the page is initially loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading dashboard..." />
      </div>
    );
  }

  // Redirect based on user role
  if (user) {
    if (user.role === 'super-admin') {
      return <Navigate to="/dashboard/super-admin" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/dashboard/admin" replace />;
    } else if (user.role === 'technician') {
      return <Navigate to="/dashboard/lab-technician" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Welcome Message */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden transition-all duration-500 transform hover:shadow-2xl hover:-translate-y-1">
          <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
            <div className="flex justify-between items-center">
              <div className={`transition-all duration-500 ${animateElements ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                <h1 className="text-3xl font-extrabold text-white">Dashboard</h1>
                <p className="text-base text-blue-100 mt-1">
                  Welcome, {user?.name || 'User'}! | Role: {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Lab Name */}
          {user?.lab?.name && (
            <div className="py-4 text-center bg-blue-50 border-b border-blue-100">
              <h2 className="text-xl font-bold text-blue-800">{user?.lab?.name || 'PathLab'}</h2>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.name}
              className={`overflow-hidden rounded-lg bg-white shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 ${animateElements ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="p-5 border-b-4 border-blue-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                    <stat.icon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">
                        {stat.name}
                      </dt>
                      <dd>
                        <div className="text-2xl font-bold text-gray-900">
                          {isDataLoading ? (
                            <div className="h-8 w-16 bg-blue-200 animate-pulse rounded"></div>
                          ) : (
                            getStatValue(stat.name)
                          )}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Reports */}
        <div className={`bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden transition-all duration-500 transform hover:shadow-2xl delay-300 ${animateElements ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="px-6 py-5 border-b border-blue-100 bg-blue-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-800">Recent Reports</h3>
              <Link
                to="/reports"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-white px-3 py-1 rounded-lg shadow-sm border border-blue-200 transition-colors"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="px-6 py-5">
            {isDataLoading ? (
              <SkeletonLoader type="list-item" count={3} />
            ) : (
              <ul className="divide-y divide-blue-100">
              {recentReports.map((report) => (
                <li key={report.id} className="py-4 hover:bg-blue-50 rounded-md transition-all duration-300 transform hover:scale-[1.01]">
                  <Link
                    to={`/reports/${report.id}/print`}
                    className="block"
                  >
                    <div className="flex items-center justify-between">
                      <div className="truncate">
                        <div className="flex text-sm">
                          <p className="font-medium text-blue-600 truncate">
                            {report.patientName}
                          </p>
                          <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                            for {report.testName}
                          </p>
                        </div>
                      </div>
                      <div className="ml-2 flex flex-shrink-0">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            report.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <ClockIcon
                            className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                            aria-hidden="true"
                          />
                          Created on {report.date}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
              {recentReports.length === 0 && (
                <li className="py-4 text-center text-gray-500">
                  No recent reports found
                </li>
              )}
              </ul>
            )}
            <div className="mt-6">
              <Link
                to="/reports"
                className="flex w-full items-center justify-center rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 transition-all duration-300 transform hover:scale-[1.02]"
              >
                View all reports
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
