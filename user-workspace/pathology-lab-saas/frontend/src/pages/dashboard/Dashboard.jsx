import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
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
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Welcome back! Here's an overview of your laboratory's performance.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
          >
            <dt>
              <div className="absolute rounded-md bg-primary-500 p-3">
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  getStatValue(stat.name)
                )}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Reports</h2>
          <Link
            to="/reports"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            View all reports
          </Link>
        </div>
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {recentReports.map((report) => (
              <li key={report.id}>
                <Link
                  to={`/reports/${report.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="truncate">
                        <div className="flex text-sm">
                          <p className="font-medium text-primary-600 truncate">
                            {report.patientName}
                          </p>
                          <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                            for {report.testName}
                          </p>
                        </div>
                      </div>
                      <div className="ml-2 flex flex-shrink-0">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
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
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
