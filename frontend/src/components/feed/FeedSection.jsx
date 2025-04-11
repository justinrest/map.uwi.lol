import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMap } from '../../hooks/useMap';

const FeedSection = () => {
  const navigate = useNavigate();
  const {
    newPlaces,
    topPlaces,
    fetchNewPlaces,
    fetchTopPlaces,
    loading
  } = useMap();
  const [activeTab, setActiveTab] = useState('new');

  useEffect(() => {
    // Refresh data when tab changes
    const loadFeedData = async () => {
      try {
        if (activeTab === 'new') {
          await fetchNewPlaces();
        } else {
          await fetchTopPlaces();
        }
      } catch (error) {
        console.error(`Error loading ${activeTab} places:`, error);
      }
    };

    loadFeedData();
  }, [activeTab, fetchNewPlaces, fetchTopPlaces]);

  const handlePlaceClick = (placeId) => {
    navigate(`/places/${placeId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    // If less than 24 hours ago, show relative time
    const diff = (new Date() - date) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

    // Otherwise show simple date
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p>Loading feed...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-4 py-3 text-sm font-medium flex-1 ${activeTab === 'new'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('new')}
        >
          Newest Places
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium flex-1 ${activeTab === 'top'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('top')}
        >
          Top Places
        </button>
      </div>

      {/* Feed content */}
      <div className="divide-y">
        {activeTab === 'new'
          ? (newPlaces?.length > 0 ? newPlaces.map(place => (
            <div
              key={place.id}
              className="hover:bg-gray-50 p-4 transition cursor-pointer"
              onClick={() => handlePlaceClick(place.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{place.name}</h3>
                  <p className="mt-1 text-gray-500 text-sm line-clamp-2">
                    {place.description.substring(0, 100)}
                    {place.description.length > 100 ? '...' : ''}
                  </p>
                  <div className="flex items-center mt-2">
                    <span
                      className="inline-block mr-2 px-2 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: `${place.category?.color}20`,
                        color: place.category?.color
                      }}
                    >
                      {place.category?.name || 'Uncategorized'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatDate(place.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
            : (
              <div className="p-8 text-gray-500 text-center">
                <p>No places have been added yet</p>
              </div>
            )
          )
          : (topPlaces?.length > 0 ? topPlaces.map(place => (
            <div
              key={place.id}
              className="hover:bg-gray-50 p-4 transition cursor-pointer"
              onClick={() => handlePlaceClick(place.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{place.name}</h3>
                  <div className="flex items-center space-x-2 mt-1 text-sm">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 w-4 h-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      {place.like_count || 0}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 w-4 h-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {place.favorite_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center mt-2">
                    <span
                      className="inline-block px-2 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: `${place.category?.color}20`,
                        color: place.category?.color
                      }}
                    >
                      {place.category?.name || 'Uncategorized'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
            : (
              <div className="p-8 text-gray-500 text-center">
                <p>No popular places yet</p>
              </div>
            )
          )
        }
      </div>
    </div>
  );
};

export default FeedSection;