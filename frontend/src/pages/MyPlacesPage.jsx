import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMap } from '../hooks/useMap';
import EditPlaceModal from '../components/places/EditPlaceModal';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';

const MyPlacesPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const { getUserPlaces, deletePlace, loading } = useMap();
  
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchUserPlaces();
  }, [isAuthenticated, navigate]);
  
  const fetchUserPlaces = async () => {
    try {
      const userPlaces = await getUserPlaces();
      setPlaces(userPlaces);
    } catch (err) {
      setError('Failed to load your places');
      console.error(err);
    }
  };
  
  const handleEditClick = (place) => {
    setSelectedPlace(place);
    setShowEditModal(true);
  };
  
  const handleDeleteClick = (place) => {
    setSelectedPlace(place);
    setShowDeleteModal(true);
  };
  
  const handlePlaceUpdated = () => {
    setShowEditModal(false);
    setSuccess('Place updated successfully');
    fetchUserPlaces();
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedPlace) return;
    
    try {
      setIsDeleting(true);
      await deletePlace(selectedPlace.id);
      setShowDeleteModal(false);
      setSuccess('Place deleted successfully');
      
      // Remove from local state
      setPlaces(places.filter(p => p.id !== selectedPlace.id));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Failed to delete place');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleViewPlace = (placeId) => {
    navigate(`/places/${placeId}`);
  };
  
  if (loading) {
    return (
      <div className="mx-auto p-4 container">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Loading your places...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4 container">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="bg-blue-600 p-6 text-white">
          <h1 className="font-bold text-2xl">My Places</h1>
          <p className="mt-1 text-blue-200">
            Manage the places you've added to the map
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 m-4 p-4 rounded-lg text-red-600">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 m-4 p-4 rounded-lg text-green-600">
            {success}
          </div>
        )}
        
        <div className="p-6">
          {places.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-500">You haven't added any places yet.</p>
              <button
                className="bg-blue-500 hover:bg-blue-600 mt-4 px-4 py-2 rounded-lg text-white transition"
                onClick={() => navigate('/')}
              >
                Explore the Map
              </button>
            </div>
          ) : (
            <div className="bg-white shadow sm:rounded-md overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {places.map((place) => (
                  <li key={place.id}>
                    <div className="px-4 sm:px-6 py-4">
                      <div className="flex justify-between items-center">
                        <div className="flex md:flex-row flex-col md:items-center">
                          <p className="font-medium text-blue-600 text-lg truncate">
                            {place.name}
                          </p>
                          <div className="mt-1 md:mt-0 md:ml-2">
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
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewPlace(place.id)}
                            className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md text-gray-800 text-sm transition"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditClick(place)}
                            className="bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-md text-blue-800 text-sm transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(place)}
                            className="bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-md text-red-800 text-sm transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="sm:flex sm:justify-between mt-2">
                        <div className="sm:flex">
                          <p className="flex items-center text-gray-500 text-sm">
                            {place.description.substring(0, 150)}
                            {place.description.length > 150 ? '...' : ''}
                          </p>
                        </div>
                        <div className="flex items-center mt-2 sm:mt-0 text-gray-500 text-sm">
                          <div className="flex space-x-4">
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 w-4 h-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                              </svg>
                              {place.like_count || 0}
                            </span>
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 w-4 h-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {place.favorite_count || 0}
                            </span>
                            <p className="text-xs">
                              Added on {new Date(place.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Modal */}
      {showEditModal && selectedPlace && (
        <EditPlaceModal
          show={showEditModal}
          place={selectedPlace}
          categories={[]}  // This will be fetched in the modal
          onClose={() => setShowEditModal(false)}
          onSave={handlePlaceUpdated}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPlace && (
        <DeleteConfirmModal
          show={showDeleteModal}
          title="Delete Place"
          message={`Are you sure you want to delete "${selectedPlace.name}"? This action cannot be undone.`}
          confirmButtonText="Delete"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default MyPlacesPage;