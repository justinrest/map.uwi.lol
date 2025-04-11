import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, LayersControl, Pane } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMap } from '../../hooks/useMap';
import AddPlaceModal from './AddPlaceModal';
import MapControls from './MapControls';

// Fix default icon issues in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom colored markers
const createCategoryIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Function to fetch location data from Nominatim
const fetchLocationInfo = async (lat, lon) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse.php?lat=${lat}&lon=${lon}&zoom=18&format=jsonv2`,
      {
        headers: {
          'User-Agent': 'UWI-Campus-Map/1.0'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching location data from Nominatim:', error);
    return null;
  }
};

// Map click handler component
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: onMapClick,
  });
  return null;
}

const MapView = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { places, categories, loading, fetchPlaces, likePlace } = useMap();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [addPlaceData, setAddPlaceData] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const mapRef = useRef(null);

  // UWI campus coordinates
  const UWI_COORDINATES = [10.642367, -61.398919];

  useEffect(() => {
    fetchPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMapClick = async (e) => {
    if (isAuthenticated) {
      const { lat, lng } = e.latlng;
      
      // Set initial location
      setSelectedLocation({
        lat,
        lng
      });
      
      // Fetch location info from Nominatim
      const info = await fetchLocationInfo(lat, lng);
      setLocationInfo(info);
      
      // Pre-fill data based on Nominatim response
      if (info) {
        // Determine category based on OSM type
        let suggestedCategoryId = null;
        
        if (info.category === 'amenity') {
          if (['restaurant', 'cafe', 'fast_food', 'food_court'].includes(info.type)) {
            suggestedCategoryId = categories.find(c => c.name === 'Food')?.id;
          } else if (['library', 'university', 'college'].includes(info.type)) {
            suggestedCategoryId = categories.find(c => c.name === 'Study')?.id;
          } else if (['bar', 'pub', 'nightclub', 'community_centre'].includes(info.type)) {
            suggestedCategoryId = categories.find(c => c.name === 'Hangout')?.id;
          }
        } else if (info.category === 'leisure' || info.category === 'tourism') {
          suggestedCategoryId = categories.find(c => c.name === 'Hangout')?.id;
        } else if (info.category === 'sport' || info.type === 'pitch' || info.type === 'stadium') {
          suggestedCategoryId = categories.find(c => c.name === 'Sports')?.id;
        }
        
        // Create description including address information
        let addressStr = '';
        if (info.address) {
          addressStr = Object.entries(info.address)
            .filter(([key]) => !['country_code', 'postcode'].includes(key))
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        }
        
        setAddPlaceData({
          name: info.name || info.type || 'New Place',
          description: `${info.display_name || ''}\n\n${addressStr}`,
          category_id: suggestedCategoryId || (categories.length > 0 ? categories[0].id : ''),
          latitude: lat,
          longitude: lng,
          osm_id: info.osm_id ? `${info.osm_type}/${info.osm_id}` : null,
          is_osm_imported: !!info.osm_id,
          osm_tags: info
        });
      }
      
      setShowAddModal(true);
    }
  };

  const handleLikeDislike = async (placeId, isLike) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      setActionInProgress(true);
      await likePlace(placeId, isLike);
      // Update local data
      await fetchPlaces();
    } catch (error) {
      console.error('Failed to process like/dislike:', error);
    } finally {
      setActionInProgress(false);
    }
  };
  
  const navigateToComments = (placeId) => {
    navigate(`/places/${placeId}#comments`);
  };

  const getCategoryIcon = (categoryId) => {
    if (!categories || categories.length === 0) return new L.Icon.Default();
    
    const category = categories.find(c => c.id === categoryId);
    if (!category) return new L.Icon.Default();
    
    // Map hex colors to color names for the marker library
    const colorMap = {
      '#FF5733': 'red',
      '#33FF57': 'green',
      '#3357FF': 'blue',
      '#FF33F5': 'violet',
      '#F5FF33': 'yellow'
    };
    
    const colorName = colorMap[category.color] || 'blue';
    return createCategoryIcon(colorName);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="font-semibold text-xl">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-64px)]">
      <MapContainer 
        center={UWI_COORDINATES}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <LayersControl position="topleft">
          {/* Base Layers Group */}
          <LayersControl.BaseLayer name="Satellite">
            {/* Satellite imagery layer */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer checked name="Standard Map">
            {/* Standard OpenStreetMap layer */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {/* Overlay layer with roads and labels - always visible */}
        <Pane name="labels" style={{ zIndex: 650 }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
          />
        </Pane>
        
        {/* Overlay layer with transparent roads - always visible */}
        <Pane name="roads" style={{ zIndex: 600 }}>
          <TileLayer
            url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lines/{z}/{x}/{y}{r}.png"
            attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            subdomains="abcd"
            maxZoom={20}
            opacity={0.7}
          />
        </Pane>
        
        {/* Map click handler */}
        <MapClickHandler onMapClick={handleMapClick} />
        
        {/* Place markers */}
        {places.map(place => (
          <Marker 
            key={place.id} 
            position={[place.latitude, place.longitude]}
            icon={getCategoryIcon(place.category_id)}
          >
            <Popup>
              <div className="w-60 text-center">
                <h3 className="mb-1 font-bold text-lg">{place.name}</h3>
                <span 
                  className="inline-block bg-blue-100 mb-2 px-2 py-1 rounded-full text-blue-800 text-xs"
                  style={{ 
                    backgroundColor: `${place.category?.color}20`, 
                    color: place.category?.color 
                  }}
                >
                  {place.category?.name || 'Uncategorized'}
                </span>
                
                <p className="mb-3 text-gray-600 text-sm line-clamp-3">
                  {place.description.substring(0, 100)}
                  {place.description.length > 100 ? '...' : ''}
                </p>
                
                {/* Interactive buttons for logged-in users */}
                <div className="flex justify-center space-x-1 mb-3">
                  <button 
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                      isAuthenticated 
                        ? 'bg-blue-100 hover:bg-blue-200 text-blue-800' 
                        : 'bg-gray-100 text-gray-600 cursor-not-allowed'
                    }`}
                    onClick={() => handleLikeDislike(place.id, true)}
                    disabled={!isAuthenticated || actionInProgress}
                    title={isAuthenticated ? "Like this place" : "Login to like"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <span>{place.like_count || 0}</span>
                  </button>
                  
                  <button 
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                      isAuthenticated 
                        ? 'bg-red-100 hover:bg-red-200 text-red-800' 
                        : 'bg-gray-100 text-gray-600 cursor-not-allowed'
                    }`}
                    onClick={() => handleLikeDislike(place.id, false)}
                    disabled={!isAuthenticated || actionInProgress}
                    title={isAuthenticated ? "Dislike this place" : "Login to dislike"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                    </svg>
                    <span>{place.dislike_count || 0}</span>
                  </button>
                  
                  <button 
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                      isAuthenticated 
                        ? 'bg-green-100 hover:bg-green-200 text-green-800' 
                        : 'bg-gray-100 text-gray-600 cursor-not-allowed'
                    }`}
                    onClick={() => isAuthenticated ? navigateToComments(place.id) : navigate('/login')}
                    title={isAuthenticated ? "Add a comment" : "Login to comment"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    <span>Comment</span>
                  </button>
                </div>
                
                <button 
                  className="bg-blue-500 hover:bg-blue-600 px-4 py-1.5 rounded w-full text-white text-sm"
                  onClick={() => navigate(`/places/${place.id}`)}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map controls */}
      <MapControls 
        onAddPlace={() => setShowAddModal(true)} 
        isAuthenticated={isAuthenticated}
      />
      
      {/* Add place modal */}
      {showAddModal && (
        <AddPlaceModal 
          show={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedLocation(null);
            setLocationInfo(null);
            setAddPlaceData(null);
          }}
          location={selectedLocation}
          categories={categories}
          initialData={addPlaceData}
          locationInfo={locationInfo}
        />
      )}
    </div>
  );
};

export default MapView;