import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMap } from '../hooks/useMap';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { getUserFavorites } = useMap();
  const [favoritePlaces, setFavoritePlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('favorites');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const favorites = await getUserFavorites();
        setFavoritePlaces(favorites);
      } catch (err) {
        console.error('Failed to load user data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [getUserFavorites]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePlaceClick = (placeId) => {
    navigate(`/places/${placeId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* User header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold">{currentUser.username}</h1>
              <p className="text-blue-200 mt-1">{currentUser.email}</p>
            </div>
            <button
              className="mt-4 md:mt-0 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'favorites'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('favorites')}
          >
            Favorites
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
        
        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Favorite Places</h2>
              
              {favoritePlaces.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">You haven't favorited any places yet.</p>
                  <button
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                    onClick={() => navigate('/')}
                  >
                    Explore the Map
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favoritePlaces.map(place => (
                    <div
                      key={place.id}
                      className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition"
                      onClick={() => handlePlaceClick(place.id)}
                    >
                      <h3 className="font-semibold text-gray-800">{place.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {place.description.substring(0, 100)}
                        {place.description.length > 100 ? '...' : ''}
                      </p>
                      <div className="flex items-center mt-3">
                        <span 
                          className="inline-block px-2 py-1 text-xs rounded-full"
                          style={{ 
                            backgroundColor: `${place.category?.color}20`,
                            color: place.category?.color
                          }}
                        >
                          {place.category?.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-4">Account Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={currentUser.username}
                      className="w-full md:w-1/2 px-4 py-2 border rounded-lg bg-gray-100"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={currentUser.email}
                      className="w-full md:w-1/2 px-4 py-2 border rounded-lg bg-gray-100"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                    <input
                      type="text"
                      value={new Date(currentUser.created_at).toLocaleDateString()}
                      className="w-full md:w-1/2 px-4 py-2 border rounded-lg bg-gray-100"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;