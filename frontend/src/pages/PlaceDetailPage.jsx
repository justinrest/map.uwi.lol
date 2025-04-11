import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMap } from '../hooks/useMap';
import { useAuth } from '../hooks/useAuth';
import CommentsSection from '../components/places/CommentsSection';
import PlaceActions from '../components/places/PlaceActions';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const PlaceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchPlaceById, likePlace, favoritePlace, loading, error } = useMap();
  const { isAuthenticated } = useAuth();
  const [place, setPlace] = useState(null);
  const commentsSectionRef = useRef(null);

  useEffect(() => {
    const loadPlace = async () => {
      try {
        const placeData = await fetchPlaceById(Number(id));
        setPlace(placeData);
        
        // Check if we need to scroll to comments section
        if (location.hash === '#comments' && commentsSectionRef.current) {
          setTimeout(() => {
            commentsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
            
            // Focus on comment input if user is authenticated
            const commentInput = document.getElementById('comment-input');
            if (commentInput && isAuthenticated) {
              commentInput.focus();
            }
          }, 500);
        }
      } catch (err) {
        console.error('Failed to load place:', err);
      }
    };

    loadPlace();
  }, [id, fetchPlaceById, location.hash, isAuthenticated]);

  const handleLike = async (isLike) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      await likePlace(place.id, isLike);
      // Refresh place data
      const updatedPlace = await fetchPlaceById(Number(id));
      setPlace(updatedPlace);
    } catch (err) {
      console.error('Failed to like place:', err);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      await favoritePlace(place.id);
      // Refresh place data
      const updatedPlace = await fetchPlaceById(Number(id));
      setPlace(updatedPlace);
    } catch (err) {
      console.error('Failed to favorite place:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center mx-auto p-4 h-64 container">
        <div className="text-xl">Loading place details...</div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="mx-auto p-4 container">
        <div className="bg-red-50 mb-4 p-4 rounded-md text-red-700">
          <h2 className="font-bold text-xl">Error</h2>
          <p>{error || "Place not found"}</p>
        </div>
        <button 
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white"
          onClick={() => navigate('/')}
        >
          Back to Map
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4 container">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Map preview */}
        <div className="relative h-64">
          <MapContainer 
            center={[place.latitude, place.longitude]} 
            zoom={17} 
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri'
            />
            <Marker position={[place.latitude, place.longitude]}>
              <Popup>{place.name}</Popup>
            </Marker>
          </MapContainer>
          
          <div className="top-0 right-0 left-0 absolute bg-gradient-to-b from-black/50 to-transparent p-4">
            <button 
              className="bg-white hover:bg-gray-100 px-3 py-1 rounded-full text-gray-800 text-sm"
              onClick={() => navigate('/')}
            >
              &larr; Back to Map
            </button>
          </div>
        </div>
        
        {/* Place details */}
        <div className="p-6">
          <div className="flex md:flex-row flex-col md:justify-between md:items-center">
            <div>
              <h1 className="font-bold text-gray-800 text-2xl">{place.name}</h1>
              <div className="flex items-center mt-1 mb-4">
                <span 
                  className="inline-block px-2 py-1 rounded-full text-xs"
                  style={{ 
                    backgroundColor: `${place.category.color}20`, 
                    color: place.category.color 
                  }}
                >
                  {place.category.name}
                </span>
                <span className="ml-4 text-gray-500 text-sm">
                  Added on {new Date(place.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <PlaceActions 
              place={place} 
              onLike={() => handleLike(true)}
              onDislike={() => handleLike(false)}
              onFavorite={handleFavorite}
              isAuthenticated={isAuthenticated}
            />
          </div>
          
          <div className="mt-4 text-gray-700">
            <h2 className="mb-2 font-semibold text-xl">About this place</h2>
            <p className="whitespace-pre-line">{place.description}</p>
          </div>
          
          {/* Comments section */}
          <div id="comments" ref={commentsSectionRef} className="mt-8 pt-4 border-t">
            <CommentsSection 
              placeId={place.id} 
              comments={place.comments}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailPage;