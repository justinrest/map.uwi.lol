// components/layout/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="mx-auto px-4 container">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <span className="font-bold text-blue-600 text-xl">Find D Lime</span>
          </Link>

          <nav>
            <ul className="flex items-center space-x-6">
              <li>
                <Link to="/" className="text-gray-600 hover:text-blue-600">
                  Map
                </Link>
              </li>

              {isAuthenticated ? (
                <>
                  <li>
                    <Link to="/my-places" className="text-gray-600 hover:text-blue-600">
                      My Places
                    </Link>
                  </li>
                  <li>
                    <Link to="/profile" className="text-gray-600 hover:text-blue-600">
                      Profile
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      to="/login"
                      className="text-gray-600 hover:text-blue-600"
                    >
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/register"
                      className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white transition"
                    >
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;