import { Fragment, useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CogIcon,
  XMarkIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  DocumentDuplicateIcon,
  ArrowLeftIcon,
  UserIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../../context/AuthContext';

// Navigation items based on user role
const getNavigationItems = (role) => {
  const commonItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
  ];

  // For superadmin, we don't include Reports section
  const superAdminItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Labs', href: '/labs', icon: BeakerIcon },
    { name: 'User Management', href: '/users', icon: UserGroupIcon },
    { name: 'Test Templates', href: '/templates', icon: DocumentDuplicateIcon },
    { name: 'User Intelligence', href: '/user-intelligence', icon: ClipboardDocumentCheckIcon },
    { name: 'Notification Settings', href: '/settings/notifications', icon: CogIcon },
    { name: 'Subscription Plans', href: '/plans', icon: CogIcon },
    { name: 'Audit Logs', href: '/audit-logs', icon: DocumentTextIcon },
  ];

  const adminItems = [
    ...commonItems,
    { name: 'Patients', href: '/patients', icon: UserGroupIcon },
    { name: 'Reference Doctors', href: '/doctors', icon: UserGroupIcon },
    { name: 'Test Templates', href: '/templates', icon: DocumentDuplicateIcon },
    { name: 'Report Settings', href: '/settings/reports', icon: DocumentTextIcon },
    { name: 'Inventory', href: '/inventory', icon: BeakerIcon },
    { name: 'Revenue Dashboard', href: '/finance/revenue', icon: DocumentTextIcon },
  ];

  const technicianItems = [
    ...commonItems,
    { name: 'Patients', href: '/patients', icon: UserGroupIcon },
  ];

  switch (role) {
    case 'super-admin':
      return superAdminItems;
    case 'admin':
      return adminItems;
    case 'technician':
      return technicianItems;
    default:
      return commonItems;
  }
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [labName, setLabName] = useState('PathLab');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Default to admin navigation if user role is not available
  const navigation = getNavigationItems(user?.role || 'admin');

  // Fetch lab name when component mounts or user changes
  useEffect(() => {
    if (user?.lab) {
      fetchLabName(user.lab);
    }
  }, [user]);

  // Reset sidebar open state on route change to avoid layout glitches
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Function to fetch lab name by ID
  const fetchLabName = async (labId) => {
    try {
      // Skip for super-admin as they don't belong to a specific lab
      if (user?.role === 'super-admin') {
        setLabName('Admin Portal');
        return;
      }

      const { superAdmin } = await import('../../utils/api');
      const response = await superAdmin.getLab(labId);
      
      if (response && response.data) {
        setLabName(response.data.name);
      }
    } catch (error) {
      console.error('Error fetching lab name:', error);
      // Fallback to default name
      setLabName('PathLab');
    }
  };

  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    // Use the logout function from AuthContext
    logout();
  };

  return (
    <div>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-blue-800 px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-white font-semibold text-lg whitespace-nowrap overflow-hidden text-ellipsis">
                        {labName}
                      </span>
                    </div>
                    <button 
                      onClick={() => setSidebarOpen(false)}
                      className="text-white hover:text-blue-200 transition-colors duration-200"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                className={classNames(
                                  location.pathname === item.href
                                    ? 'bg-blue-900 text-white'
                                    : 'text-white hover:text-white hover:bg-blue-700',
                                  'group flex gap-x-3 rounded-md p-3 text-base leading-6 font-semibold transition-all duration-200'
                                )}
                              >
                                <item.icon
                                  className={classNames(
                                    location.pathname === item.href ? 'text-white' : 'text-white group-hover:text-white',
                                    'h-6 w-6 shrink-0'
                                  )}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div 
        className={classNames(
          "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:w-20" : "lg:w-72"
        )}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-blue-800 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center justify-between">
            <div className="flex items-center">
              {isCollapsed ? (
                <div className="h-8 w-8 flex items-center justify-center text-white font-bold text-lg bg-blue-700 rounded-md">
                  {labName.charAt(0)}
                </div>
              ) : (
                <span className="text-white font-semibold text-lg whitespace-nowrap overflow-hidden text-ellipsis">
                  {labName}
                </span>
              )}
            </div>
            <button 
              onClick={toggleSidebar}
              className="text-white hover:text-blue-200 transition-colors duration-200"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronDoubleRightIcon className="h-5 w-5" />
              ) : (
                <ChevronDoubleLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={classNames(
                          location.pathname === item.href
                            ? 'bg-blue-900 text-white'
                            : 'text-white hover:text-white hover:bg-blue-700',
                          'group flex gap-x-3 rounded-md p-3 text-base leading-6 font-semibold transition-all duration-200',
                          isCollapsed ? 'justify-center' : ''
                        )}
                        title={item.name}
                      >
                        <item.icon
                          className={classNames(
                            location.pathname === item.href ? 'text-white' : 'text-white group-hover:text-white',
                            'h-6 w-6 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {!isCollapsed && item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className={classNames(
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:pl-20" : "lg:pl-72"
      )}>
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Back button */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 flex items-center"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            title="Go back to previous page"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" aria-hidden="true" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200" aria-hidden="true" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Profile dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="-m-1.5 flex items-center p-1.5">
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                  </div>
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                      {user?.name || 'User'}
                    </span>
                    <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'block w-full px-3 py-1 text-sm leading-6 text-gray-900 text-left'
                          )}
                        >
                          Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'block w-full px-3 py-1 text-sm leading-6 text-gray-900 text-left'
                          )}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
