import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  LayersControl,
  Pane,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useMap } from "../../hooks/useMap";
import AddPlaceModal from "./AddPlaceModal";
import MapControls from "./MapControls";

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // difference in seconds

  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
};

// Fix default icon issues in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Create custom colored markers
const createCategoryIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

// Function to fetch location data from Nominatim
const fetchLocationInfo = async (lat, lon) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse.php?lat=${lat}&lon=${lon}&zoom=18&format=jsonv2`,
      {
        headers: {
          "User-Agent": "UWI-Campus-Map/1.0",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching location data from Nominatim:", error);
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
        lng,
      });

      // Fetch location info from Nominatim
      const info = await fetchLocationInfo(lat, lng);
      setLocationInfo(info);

      // Pre-fill data based on Nominatim response
      if (info) {
        // Determine category based on OSM type
        let suggestedCategoryId = null;

        if (info.category === "amenity") {
          if (
            ["restaurant", "cafe", "fast_food", "food_court"].includes(
              info.type
            )
          ) {
            suggestedCategoryId = categories.find((c) => c.name === "Food")?.id;
          } else if (["library", "university", "college"].includes(info.type)) {
            suggestedCategoryId = categories.find(
              (c) => c.name === "Study"
            )?.id;
          } else if (
            ["bar", "pub", "nightclub", "community_centre"].includes(info.type)
          ) {
            suggestedCategoryId = categories.find(
              (c) => c.name === "Hangout"
            )?.id;
          }
        } else if (info.category === "leisure" || info.category === "tourism") {
          suggestedCategoryId = categories.find(
            (c) => c.name === "Hangout"
          )?.id;
        } else if (
          info.category === "sport" ||
          info.type === "pitch" ||
          info.type === "stadium"
        ) {
          suggestedCategoryId = categories.find((c) => c.name === "Sports")?.id;
        }

        // Create description including address information
        let addressStr = "";
        if (info.address) {
          addressStr = Object.entries(info.address)
            .filter(([key]) => !["country_code", "postcode"].includes(key))
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n");
        }

        setAddPlaceData({
          name: info.name || info.type || "New Place",
          description: `${info.display_name || ""}\n\n${addressStr}`,
          category_id:
            suggestedCategoryId ||
            (categories.length > 0 ? categories[0].id : ""),
          latitude: lat,
          longitude: lng,
          osm_id: info.osm_id ? `${info.osm_type}/${info.osm_id}` : null,
          is_osm_imported: !!info.osm_id,
          osm_tags: info,
        });
      }

      setShowAddModal(true);
    }
  };

  const handleLikeDislike = async (placeId, isLike) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setActionInProgress(true);
      await likePlace(placeId, isLike);
      // Update local data
      await fetchPlaces();
    } catch (error) {
      console.error("Failed to process like/dislike:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  const navigateToComments = (placeId) => {
    navigate(`/places/${placeId}#comments`);
  };

  const getCategoryIcon = (categoryId) => {
    if (!categories || categories.length === 0) return new L.Icon.Default();

    const category = categories.find((c) => c.id === categoryId);
    if (!category) return new L.Icon.Default();

    // Map hex colors to color names for the marker library
    const colorMap = {
      "#FF5733": "red",
      "#33FF57": "green",
      "#3357FF": "blue",
      "#FF33F5": "violet",
      "#F5FF33": "yellow",
    };

    const colorName = colorMap[category.color] || "blue";
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
              attribution="&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
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
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={getCategoryIcon(place.categories?.[0]?.id)}
          >
            <Popup maxWidth="300">
              <div className="text-center w-64">
                <h3 className="text-lg font-bold mb-1">{place.name}</h3>

                {/* Multiple categories display */}
                <div className="flex flex-wrap justify-center mb-2 gap-1">
                  {place.categories &&
                    place.categories.map((category) => (
                      <span
                        key={category.id}
                        className="inline-block px-2 py-1 rounded-full text-xs"
                        style={{
                          backgroundColor: `${category.color}20`,
                          color: "black",
                        }}
                      >
                        {category.name}
                      </span>
                    ))}
                </div>

                <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                  {place.description.substring(0, 100)}
                  {place.description.length > 100 ? "..." : ""}
                </p>

                {/* Added user info and place age */}
                <div className="text-xs text-gray-500 mb-3 flex justify-center items-center gap-1">
                  <span>Added by {place.user_username || "Anonymous"}</span>
                  <span className="mx-1">•</span>
                  <span title={new Date(place.created_at).toLocaleString()}>
                    {getTimeAgo(place.created_at)}
                  </span>
                </div>

                {/* Interactive buttons for logged-in users */}
                <div className="flex justify-center space-x-1 mb-3">
                  <button
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                      isAuthenticated
                        ? "bg-blue-100 hover:bg-blue-200 text-blue-800"
                        : "bg-gray-100 text-gray-600 cursor-not-allowed"
                    }`}
                    onClick={() => handleLikeDislike(place.id, true)}
                    disabled={!isAuthenticated || actionInProgress}
                    title={
                      isAuthenticated ? "Like this place" : "Login to like"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2a1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <span>{place.like_count || 0}</span>
                  </button>

                  <button
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                      isAuthenticated
                        ? "bg-red-100 hover:bg-red-200 text-red-800"
                        : "bg-gray-100 text-gray-600 cursor-not-allowed"
                    }`}
                    onClick={() => handleLikeDislike(place.id, false)}
                    disabled={!isAuthenticated || actionInProgress}
                    title={
                      isAuthenticated
                        ? "Dislike this place"
                        : "Login to dislike"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                    </svg>
                    <span>{place.dislike_count || 0}</span>
                  </button>

                  <button
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                      isAuthenticated
                        ? "bg-green-100 hover:bg-green-200 text-green-800"
                        : "bg-gray-100 text-gray-600 cursor-not-allowed"
                    }`}
                    onClick={() =>
                      isAuthenticated
                        ? navigateToComments(place.id)
                        : navigate("/login")
                    }
                    title={
                      isAuthenticated ? "Add a comment" : "Login to comment"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Comment</span>
                  </button>
                </div>

                <div className="flex space-x-2">
                  {/* Google Maps Button */}
                  <a
                    href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-2 py-1.5 rounded text-xs flex items-center justify-center flex-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      xmlnsXlink="http://www.w3.org/1999/xlink"
                      className="w-4 h-4 text-blue-500"
                      viewBox="0 0 5644.173 5644.173"
                    >
                      <defs>
                        <path
                          id="a"
                          d="M4300.322 0c-439.439 0-829.828 210.985-1075.081 537.54H403.155C181.42 537.54 0 718.96 0 940.695v4300.322c0 221.736 181.42 403.155 403.155 403.155h4300.322c221.735 0 403.155-181.419 403.155-403.155V2609.086c282.208-412.562 537.54-784.137 537.54-1265.235C5644.173 601.373 5042.8 0 4300.322 0"
                        ></path>
                        <path
                          id="m"
                          fill="#DB4437"
                          d="M4300.322 0c-742.478 0-1343.851 601.373-1343.851 1343.851 0 1012.591 1130.85 1540.053 1264.563 2985.364 4.031 40.315 38.3 71.896 79.287 71.896s75.927-31.581 79.287-71.896c133.713-1445.312 1264.563-1972.773 1264.563-2985.364C5644.173 601.373 5042.8 0 4300.322 0"
                        ></path>
                        <clipPath id="c">
                          <use xlinkHref="#a" overflow="visible"></use>
                        </clipPath>
                        <filter
                          id="b"
                          width="280%"
                          height="280%"
                          x="-70%"
                          y="-70%"
                        >
                          <feGaussianBlur
                            in="SourceAlpha"
                            stdDeviation="600"
                          ></feGaussianBlur>
                          <feComponentTransfer>
                            <feFuncA exponent="0.7" type="gamma"></feFuncA>
                          </feComponentTransfer>
                          <feOffset dx="300" dy="100"></feOffset>
                        </filter>
                      </defs>
                      <path
                        fill="#0F9D58"
                        d="m2553.316 3090.856 2268.569-2535.46c-37.479-11.6-77.248-17.856-118.408-17.856H403.155C181.42 537.54 0 718.96 0 940.695v4300.322c0 41.16 6.257 80.929 17.856 118.408z"
                      ></path>
                      <path
                        fill="#4285F4"
                        d="M2553.316 3090.856 284.747 5626.316c37.479 11.6 77.248 17.856 118.408 17.856h4300.322c41.16 0 80.929-6.256 118.408-17.856z"
                      ></path>
                      <path
                        fill="#D2D2D2"
                        d="m2553.316 3090.856 2535.46 2268.569c11.6-37.479 17.856-77.248 17.856-118.408V940.695c0-41.16-6.257-80.929-17.856-118.408z"
                      ></path>
                      <path
                        fill="#F1F1F1"
                        d="M5106.633 5241.018 2687.701 2822.086l-470.348 403.155 2418.931 2418.931h67.192c221.737.001 403.157-181.419 403.157-403.154"
                      ></path>
                      <path
                        fill="#FFDE48"
                        d="M4703.478 537.54 0 5241.018c0 221.736 181.42 403.155 403.155 403.155h67.193l4636.285-4636.285v-67.193c0-221.735-181.42-403.155-403.155-403.155"
                      ></path>
                      <path
                        fill="#FFF"
                        fillOpacity="0.2"
                        d="M4703.478 537.54H403.155C181.42 537.54 0 718.96 0 940.695v33.596c0-221.735 181.42-403.155 403.155-403.155h4300.322c221.735 0 403.155 181.42 403.155 403.155v-33.596c.001-221.735-181.419-403.155-403.154-403.155"
                      ></path>
                      <path
                        fill="#263238"
                        fillOpacity="0.1"
                        d="M4703.478 5610.577H403.155C181.42 5610.577 0 5429.157 0 5207.421v33.596c0 221.736 181.42 403.155 403.155 403.155h4300.322c221.735 0 403.155-181.419 403.155-403.155v-33.596c.001 221.736-181.419 403.156-403.154 403.156"
                      ></path>
                      <path
                        fill="#EEE"
                        d="M1142.273 1545.428v286.24h397.78c-31.581 169.997-180.748 293.631-397.78 293.631-241.221 0-437.423-204.265-437.423-444.814s196.202-444.814 437.423-444.814c108.852 0 205.609 37.628 282.881 110.196l211.657-211.656c-128.338-120.275-294.975-193.515-494.537-193.515-408.531 0-739.118 330.587-739.118 739.118s330.587 739.118 739.118 739.118c426.672 0 709.553-300.351 709.553-722.32 0-52.41-4.703-102.805-13.438-151.183z"
                      ></path>
                      <use
                        xlinkHref="#m"
                        clipPath="url(#c)"
                        filter="url(#b)"
                        opacity="0.25"
                      ></use>
                      <use xlinkHref="#m"></use>
                      <circle
                        cx="4300.322"
                        cy="1343.851"
                        r="470.348"
                        fill="#7B231E"
                      ></circle>
                      <path
                        fill="#FFF"
                        fillOpacity="0.2"
                        d="M4300.322 33.596c735.758 0 1333.1 591.294 1343.179 1324.365 0-4.703.672-9.407.672-14.11C5644.173 601.373 5042.8 0 4300.322 0s-1343.85 601.373-1343.85 1343.851c0 4.703.672 9.407.672 14.11 10.078-733.07 607.42-1324.365 1343.178-1324.365"
                      ></path>
                      <path
                        fill="#3E2723"
                        fillOpacity="0.2"
                        d="M4379.609 4295.619c-3.36 40.315-38.3 71.896-79.287 71.896s-75.927-31.581-79.287-71.896C4088.666 2857.027 2967.894 2327.55 2957.144 1324.365c0 6.719-.672 12.767-.672 19.486 0 1012.591 1130.85 1540.053 1264.564 2985.364 4.031 40.315 38.3 71.896 79.287 71.896s75.927-31.581 79.287-71.896c133.712-1445.312 1264.563-1972.773 1264.563-2985.364 0-6.719-.672-12.767-.672-19.486-10.751 1003.184-1130.851 1533.333-1263.892 2971.254"
                      ></path>
                      <radialGradient
                        id="r"
                        cx="140.097"
                        cy="5533.941"
                        r="6883.606"
                        gradientTransform="matrix(1 0 0 -1 0 6182.752)"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop
                          offset="0"
                          stopColor="#fff"
                          stopOpacity="0.1"
                        ></stop>
                        <stop
                          offset="1"
                          stopColor="#fff"
                          stopOpacity="0"
                        ></stop>
                      </radialGradient>
                      <path
                        fill="url(#r)"
                        d="M4300.322 0c-439.439 0-829.828 210.985-1075.081 537.54H403.155C181.42 537.54 0 718.96 0 940.695v4300.322c0 221.736 181.42 403.155 403.155 403.155h4300.322c221.735 0 403.155-181.419 403.155-403.155V2609.086c282.208-412.562 537.54-784.137 537.54-1265.235C5644.173 601.373 5042.8 0 4300.322 0"
                      ></path>
                    </svg>
                    <span className="text-xs text-gray-600 ml-1">
                      Google Maps
                    </span>
                  </a>

                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1.5 rounded text-xs flex-1"
                    onClick={() => navigate(`/places/${place.id}`)}
                  >
                    View Details
                  </button>
                </div>
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
