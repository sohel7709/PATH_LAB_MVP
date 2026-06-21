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
  ChartBarIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../../context/AuthContext';

const getNavigationItems = (role) => {
  const commonItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
  ];

  const superAdminItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Labs', href: '/labs', icon: BeakerIcon },
    { name: 'User Management', href: '/users', icon: UserGroupIcon },
    { name: 'Test Templates', href: '/templates', icon: DocumentDuplicateIcon },
    { name: 'User Intelligence', href: '/user-intelligence', icon: ClipboardDocumentCheckIcon },
    { name: 'Subscription Plans', href: '/plans', icon: CogIcon },
    { name: 'Lab Subscriptions', href: '/subscriptions/manage', icon: ClipboardDocumentCheckIcon },
    { name: 'Notification Settings', href: '/settings/notifications', icon: CogIcon },
    { name: 'Revenue', href: '/revenue', icon: ChartBarIcon },
    { name: 'Audit Logs', href: '/audit-logs', icon: DocumentTextIcon },
  ];

  const adminItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Patients', href: '/patients', icon: UserGroupIcon },
    { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
    { name: 'Reference Doctors', href: '/doctors', icon: UserGroupIcon },
    { name: 'Test Templates', href: '/templates', icon: DocumentDuplicateIcon },
    { name: 'Report Settings', href: '/settings/reports', icon: DocumentTextIcon },
    { name: 'Subscription Plans', href: '/subscriptions/plans', icon: CreditCardIcon },
    { name: 'Notification Settings', href: '/settings/notifications', icon: CogIcon },
    { name: 'Revenue Dashboard', href: '/finance/revenue', icon: ChartBarIcon },
    { name: 'Technicians', href: '/users', icon: UserGroupIcon },
    { name: 'Inventory', href: '/inventory', icon: BeakerIcon },
  ];

  const technicianItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Patients', href: '/patients', icon: UserGroupIcon },
    { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
  ];

  switch (role) {
    case 'super-admin': return superAdminItems;
    case 'admin': return adminItems;
    case 'technician': return technicianItems;
    default: return commonItems;
  }
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [labName, setLabName] = useState('PathLab');
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = getNavigationItems(user?.role || 'admin');

  useEffect(() => {
    if (user?.lab) {
      fetchLabName(user.lab);
    }
  }, [user]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const fetchLabName = async (labId) => {
    try {
      if (user?.role === 'super-admin') {
        setLabName('Admin Portal');
        return;
      }
      const { superAdmin } = await import('../../utils/api');
      const response = await superAdmin.getLab(labId);
      if (response && response.data) {
        setLabName(response.data.name);
      }
    } catch {
      setLabName('PathLab');
    }
  };

  const handleLogout = () => { logout(); };

  const NavItem = ({ item, collapsed }) => {
    const isActive = location.pathname === item.href;
    return (
      <li>
        <Link
          to={item.href}
          title={item.name}
          className={classNames(
            isActive
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white',
            'group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
            collapsed ? 'justify-center' : ''
          )}
        >
          <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!collapsed && <span className="truncate">{item.name}</span>}
        </Link>
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
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
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" />
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
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col bg-slate-900 overflow-hidden">
                  <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {labName.charAt(0)}
                      </div>
                      <span className="text-white font-semibold text-base truncate">{labName}</span>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <ul role="list" className="space-y-1">
                      {navigation.map((item) => (
                        <NavItem key={item.name} item={item} collapsed={false} />
                      ))}
                    </ul>
                  </nav>
                  <div className="border-t border-slate-700/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.replace('-', ' ')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div
        className={classNames(
          'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:w-16' : 'lg:w-64'
        )}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="flex grow flex-col bg-slate-900 overflow-hidden">
          <div className="flex h-16 shrink-0 items-center px-3 border-b border-slate-700/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {labName.charAt(0)}
              </div>
              {!isCollapsed && (
                <span className="text-white font-semibold text-base truncate">{labName}</span>
              )}
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul role="list" className="space-y-1">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} collapsed={isCollapsed} />
              ))}
            </ul>
          </nav>
          <div className="border-t border-slate-700/50 p-3">
            <div className={classNames('flex items-center gap-3', isCollapsed ? 'justify-center' : '')}>
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.replace('-', ' ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className={classNames('transition-all duration-300 ease-in-out', isCollapsed ? 'lg:pl-16' : 'lg:pl-64')}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6">
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex flex-1 items-center">
            <div className="flex-1" />
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden lg:block text-sm font-medium text-slate-700">{user?.name || 'User'}</span>
                <ChevronDownIcon className="hidden lg:block h-4 w-4 text-slate-400" aria-hidden="true" />
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
                <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={classNames(active ? 'bg-slate-50' : '', 'block px-4 py-2 text-sm text-slate-700')}
                      >
                        Profile
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={classNames(active ? 'bg-slate-50' : '', 'block w-full text-left px-4 py-2 text-sm text-slate-700')}
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

        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="page-enter">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
