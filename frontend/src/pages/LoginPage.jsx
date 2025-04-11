// LoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!username.trim() || !password.trim()) {
      setFormError('Please enter both username and password');
      return;
    }
    
    try {
      setLoading(true);
      await login(username, password);
      navigate('/');
    } catch (err) {
      setFormError(error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="bg-white shadow-md p-6 rounded-lg w-full max-w-md">
        <h1 className="mb-6 font-bold text-2xl text-center">Login to UWI Map</h1>
        
        {formError && (
          <div className="bg-red-50 mb-4 p-3 rounded-lg text-red-600">
            {formError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block mb-2 text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 py-2 rounded-lg w-full text-white transition duration-200"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="mt-4 text-gray-600 text-center">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-500 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

// RegisterPage.js
const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, error } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setFormError('All fields are required');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      navigate('/');
    } catch (err) {
      setFormError(error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="bg-white shadow-md p-6 rounded-lg w-full max-w-md">
        <h1 className="mb-6 font-bold text-2xl text-center">Create an Account</h1>
        
        {formError && (
          <div className="bg-red-50 mb-4 p-3 rounded-lg text-red-600">
            {formError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block mb-2 text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block mb-2 text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block mb-2 text-gray-700">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 py-2 rounded-lg w-full text-white transition duration-200"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        <p className="mt-4 text-gray-600 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export { LoginPage, RegisterPage };