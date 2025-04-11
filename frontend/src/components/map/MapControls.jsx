import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMap } from '../../hooks/useMap';

const MapControls = ({ onAddPlace, isAuthenticated }) => {
  const navigate = useNavigate();
  const { categories, fetchPlaces } = useMap();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleAddPlace = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    onAddPlace();
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchPlaces(categoryId);
    setShowFilters(false);
  };

  const handleClearFilter = () => {
    setSelectedCategory(null);
    fetchPlaces();
    setShowFilters(false);
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategory || !categories) return null;
    const category = categories.find(c => c.id === selectedCategory);
    return category ? category.name : null;
  };

  return (
    <div className="top-4 right-4 z-[99999] absolute flex flex-col space-y-2">
      {/* Main controls */}
      <div className="flex space-x-2">
        <button
          className="bg-white hover:bg-gray-100 shadow-md p-3 rounded-full"
          onClick={handleAddPlace}
          title="Add a new place"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        
        <button
          className={`bg-white rounded-full p-3 shadow-md hover:bg-gray-100 ${showFilters ? 'bg-blue-100' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          title="Filter places by category"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>
      
      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white shadow-md p-4 rounded-lg w-64">
          <h3 className="mb-2 font-medium">Filter by Category</h3>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories && categories.map(category => (
              <button
                key={category.id}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                  selectedCategory === category.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleCategoryFilter(category.id)}
              >
                <span 
                  className="mr-2 rounded-full w-4 h-4"
                  style={{ backgroundColor: category.color }}
                ></span>
                {category.name}
              </button>
            ))}
          </div>
          
          {selectedCategory && (
            <button
              className="mt-3 w-full text-blue-600 text-sm hover:underline"
              onClick={handleClearFilter}
            >
              Clear filter
            </button>
          )}
        </div>
      )}
      
      {/* Active filter indicator */}
      {selectedCategory && !showFilters && (
        <div className="flex items-center bg-blue-500 shadow-md px-4 py-2 rounded-full text-white text-sm">
          <span>Showing: {getSelectedCategoryName()}</span>
          <button
            className="ml-2 text-white hover:text-blue-100"
            onClick={handleClearFilter}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default MapControls;