import React, { useState, useEffect } from 'react';
import { useMap } from '../../hooks/useMap';

const AddPlaceModal = ({ 
  show, 
  onClose, 
  location, 
  categories,
  initialData,
  locationInfo 
}) => {
  const { addPlace, loading } = useMap();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_ids: [],  // Changed from category_id to category_ids array
    latitude: location?.lat || 0,
    longitude: location?.lng || 0,
    osm_id: null,
    is_osm_imported: false,
    osm_tags: null
  });
  const [error, setError] = useState('');
  const [usingOsmData, setUsingOsmData] = useState(false);

  useEffect(() => {
    if (location) {
      setFormData(prev => ({
        ...prev,
        latitude: location.lat,
        longitude: location.lng
      }));
    }
  }, [location]);

  useEffect(() => {
    // Set default category if available
    if (categories && categories.length > 0 && formData.category_ids.length === 0) {
      setFormData(prev => ({
        ...prev,
        category_ids: [categories[0].id]
      }));
    }
  }, [categories, formData.category_ids]);

  useEffect(() => {
    // Use initialData if provided
    if (initialData) {
      // Convert category_id to category_ids array if needed
      const updatedData = { ...initialData };
      if (initialData.category_id && !initialData.category_ids) {
        updatedData.category_ids = [initialData.category_id];
        delete updatedData.category_id;
      }
      setFormData(updatedData);
      setUsingOsmData(initialData.is_osm_imported);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'category_ids') {
      // Handle multiple select for categories
      const options = e.target.options;
      const selectedValues = [];
      for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
          selectedValues.push(parseInt(options[i].value, 10));
        }
      }
      setFormData(prev => ({
        ...prev,
        [name]: selectedValues
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'category_id' ? parseInt(value, 10) : value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter a name for this place');
      return false;
    }
    
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return false;
    }
    
    if (formData.category_ids.length === 0) {
      setError('Please select at least one category');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await addPlace(formData);
      onClose();
    } catch (err) {
      setError('Failed to add place. Please try again.');
      console.error(err);
    }
  };

  // Helper function to toggle category selection
  const toggleCategory = (categoryId) => {
    setFormData(prev => {
      const categoryIds = [...prev.category_ids];
      const index = categoryIds.indexOf(categoryId);
      
      if (index === -1) {
        // Add category
        categoryIds.push(categoryId);
      } else {
        // Remove category
        categoryIds.splice(index, 1);
      }
      
      return {
        ...prev,
        category_ids: categoryIds
      };
    });
  };

  if (!show) return null;

  return (
    <div className="z-[999999] fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
      <div className="relative bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <button 
          className="top-4 right-4 absolute text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6">
          <h2 className="mb-4 font-bold text-xl">Add New Place</h2>
          
          {locationInfo && (
            <div className="bg-blue-50 mb-4 p-3 rounded-lg">
              {locationInfo.name && (
                <p className="mt-1 text-sm">Existing Place Imported: <span className="font-medium">{locationInfo.name}</span></p>
              )}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 mb-4 p-3 rounded-lg text-red-600">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block mb-2 text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="E.g., Great Study Spot"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-gray-700">Categories (Select multiple)</label>
              <div className="max-h-48 overflow-y-auto border rounded-lg px-3 py-2">
                {categories && categories.map(category => (
                  <div key={category.id} className="py-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-blue-600"
                        checked={formData.category_ids.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        disabled={loading}
                      />
                      <span 
                        className="inline-block w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></span>
                      <span>{category.name}</span>
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Hold Ctrl/Cmd to select multiple categories
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block mb-2 text-gray-700">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe this place and why it's great..."
                rows="4"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-gray-700">Location</label>
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <input
                    type="text"
                    value={formData.latitude.toFixed(6)}
                    className="bg-gray-50 px-4 py-2 border rounded-lg w-full"
                    readOnly
                  />
                  <p className="mt-1 text-gray-500 text-xs">Latitude</p>
                </div>
                <div className="w-1/2">
                  <input
                    type="text"
                    value={formData.longitude.toFixed(6)}
                    className="bg-gray-50 px-4 py-2 border rounded-lg w-full"
                    readOnly
                  />
                  <p className="mt-1 text-gray-500 text-xs">Longitude</p>
                </div>
              </div>
            </div>
            
            {/* OSM data badge */}
            {formData.osm_id && (
              <div className="bg-green-50 mb-4 p-3 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <svg className="mr-2 w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-green-700 text-sm">
                    This location is imported from OpenStreetMap (ID: {formData.osm_id})
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 py-2 rounded-lg w-1/2 text-gray-800 transition duration-200"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 py-2 rounded-lg w-1/2 text-white transition duration-200"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Place'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPlaceModal;