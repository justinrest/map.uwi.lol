import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MapProvider } from './contexts/MapContext';
import HomePage from './pages/HomePage';
import { LoginPage, RegisterPage } from './pages/LoginPage'; // Import both from the same file
import PlaceDetailPage from './pages/PlaceDetailPage';
import ProfilePage from './pages/ProfilePage';
import Header from './components/layout/Header'; // Import from correct location
import PrivateRoute from './components/auth/PrivateRoute';
import MyPlacesPage from './pages/MyPlacesPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <MapProvider>
          <div className="flex flex-col bg-gray-100 min-h-screen">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/places/:id" element={<PlaceDetailPage />} />
                <Route path="/profile" element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                } />
                <Route path="/my-places" element={
                  <PrivateRoute >
                    <MyPlacesPage />
                  </PrivateRoute>
                } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="bg-gray-800 p-4 text-white text-center">
          <p>© 2025 UWI Map - Made with ❤️ for UWI Students</p>
        </footer>
      </div>
    </MapProvider>
    </AuthProvider >
    </Router >
  );
}

export default App;