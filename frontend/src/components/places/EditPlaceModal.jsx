import React, { useState, useEffect } from 'react';
import { useMap } from '../../hooks/useMap';

const EditPlaceModal = ({ show, place, onClose, onSave }) => {
  const { updatePlace, fetchCategories, loading } = useMap();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_ids: []  // Changed from category_id to category_ids array
  });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (place) {
      // Convert categories array to category_ids array
      const categoryIds = place.categories ? place.categories.map(cat => cat.id) : [];
      
      setFormData({
        name: place.name || '',
        description: place.description || '',
        category_ids: categoryIds
      });
    }
    
    // Fetch categories
    const loadCategories = async () => {
      try {
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    
    loadCategories();
  }, [place, fetchCategories]);

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
      await updatePlace(place.id, formData);
      onSave();
    } catch (err) {
      setError('Failed to update place. Please try again.');
      console.error(err);
    }
  };

  if (!show) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
      <div className="relative bg-white rounded-lg w-full max-w-md">
        <button 
          className="top-4 right-4 absolute text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6">
          <h2 className="mb-4 font-bold text-xl">Edit Place</h2>
          
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
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={loading}
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-gray-700">Categories (Select multiple)</label>
              <div className="max-h-48 overflow-y-auto border rounded-lg px-3 py-2">
                {categories.map(category => (
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
                You can select multiple categories
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block mb-2 text-gray-700">Description</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={loading}
              ></textarea>
            </div>
            
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
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPlaceModal;