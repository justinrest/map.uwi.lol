// PlaceActions.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PlaceActions = ({ place, onLike, onDislike, onFavorite, isAuthenticated }) => {
  const navigate = useNavigate();

  const handleAction = (action) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    action();
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
        onClick={() => handleAction(onLike)}
        title="Like this place"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
        <span>{place.like_count || 0}</span>
      </button>
      
      <button
        className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
        onClick={() => handleAction(onDislike)}
        title="Dislike this place"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
        </svg>
        <span>{place.dislike_count || 0}</span>
      </button>
      
      <button
        className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
        onClick={() => handleAction(onFavorite)}
        title="Add to favorites"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-5 h-5 text-yellow-500" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span>{place.favorite_count || 0}</span>
      </button>
    </div>
  );
};

export default PlaceActions;