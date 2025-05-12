import React, { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../common/ThemeToggle';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Disclosure as="nav" className="bg-primary-600 dark:bg-purple-800 shadow-lg">
      {({ open }) => (
        <>
          <div className="container mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex-shrink-0 flex items-center">
                  <span className="text-white text-xl font-bold">TFW MMA</span>
                </Link>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="text-white hover:text-gray-200 px-3 py-2 text-sm font-medium"
                  >
                    Home
                  </Link>
                  {user && (
                    <>
                      <Link
                      to="/dashboard"
                      className="text-white hover:text-gray-200 px-3 py-2 text-sm font-medium"
                      >
                      Dashboard
                      </Link>
                      <Link
                      to="/schedule"
                      className="text-white hover:text-gray-200 px-3 py-2 text-sm font-medium"
                      >
                      Schedule
                      </Link>
                        <Link
                          to="/progress"
                          className="text-white hover:text-gray-200 px-3 py-2 text-sm font-medium"
                        >
                          Lift Progress
                        </Link>
                    </>
                  )}
                  <Link
                  to="/class"
                  className="text-white hover:text-gray-200 px-3 py-2 text-sm font-medium"
                  >
                  Current Class
                  </Link>
                <Link
                  to="/lifting-class"
                  className="text-white hover:text-gray-200 px-3 py-2 text-sm font-medium"
                >
                  Lifting Class
                </Link>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <ThemeToggle />
                <div className="ml-3">
                {user ? (
                  <Menu as="div" className="ml-3 relative">
                    <div>
                      <Menu.Button className="bg-primary-700 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-700 focus:ring-white">
                        <span className="sr-only">Open user menu</span>
                        <div 
                          className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white"
                          aria-hidden="true" 
                          role="img"
                        >
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-purple-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/profile"
                              className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} block px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                            >
                              Profile
                            </Link>
                          )}
                        </Menu.Item>
                        {user.role === 'ADMIN' && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/admin"
                                className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} block px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                              >
                                Admin
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="space-x-4">
                    <Link
                      to="/login"
                      className="text-white hover:text-gray-200 px-3 py-2 text-sm font-medium"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      className="bg-white text-primary-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
                </div>
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <ThemeToggle />
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-200 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Disclosure.Button
                as={Link}
                to="/"
                className="text-white block px-3 py-2 rounded-md text-base font-medium"
              >
                Home
              </Disclosure.Button>
              {user && (
                <>
                  <Disclosure.Button
                    as={Link}
                    to="/dashboard"
                    className="text-white block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Dashboard
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    to="/schedule"
                    className="text-white block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Schedule
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    to="/progress"
                    className="text-white block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Lift Progress
                  </Disclosure.Button>
                </>
              )}
              <Disclosure.Button
              as={Link}
              to="/class"
              className="text-white block px-3 py-2 rounded-md text-base font-medium"
              >
              Current Class
              </Disclosure.Button>
                <Disclosure.Button
                  as={Link}
                  to="/lifting-class"
                  className="text-white block px-3 py-2 rounded-md text-base font-medium"
                >
                  Lifting Class
                </Disclosure.Button>
            </div>
            <div className="pt-4 pb-3 border-t border-primary-700">
              {user ? (
                <>
                  <div className="flex items-center px-5">
                    <div className="flex-shrink-0">
                      <div 
                        className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white"
                        aria-hidden="true"
                        role="img"
                      >
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-white">{user.firstName} {user.lastName}</div>
                      <div className="text-sm font-medium text-primary-200">{user.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    <Disclosure.Button
                      as={Link}
                      to="/profile"
                      className="block px-3 py-2 rounded-md text-base font-medium text-white"
                    >
                      Profile
                    </Disclosure.Button>
                    {user.role === 'ADMIN' && (
                      <Disclosure.Button
                        as={Link}
                        to="/admin"
                        className="block px-3 py-2 rounded-md text-base font-medium text-white"
                      >
                        Admin
                      </Disclosure.Button>
                    )}
                    <Disclosure.Button
                      as="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white"
                    >
                      Sign out
                    </Disclosure.Button>
                  </div>
                </>
              ) : (
                <div className="px-2 space-y-1">
                  <Disclosure.Button
                    as={Link}
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white"
                  >
                    Sign in
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    to="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white"
                  >
                    Sign up
                  </Disclosure.Button>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar;