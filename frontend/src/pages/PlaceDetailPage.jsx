import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useMap } from "../hooks/useMap";
import { useAuth } from "../hooks/useAuth";
import CommentsSection from "../components/places/CommentsSection";
import PlaceActions from "../components/places/PlaceActions";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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
        if (location.hash === "#comments" && commentsSectionRef.current) {
          setTimeout(() => {
            commentsSectionRef.current.scrollIntoView({ behavior: "smooth" });

            // Focus on comment input if user is authenticated
            const commentInput = document.getElementById("comment-input");
            if (commentInput && isAuthenticated) {
              commentInput.focus();
            }
          }, 500);
        }
      } catch (err) {
        console.error("Failed to load place:", err);
      }
    };

    loadPlace();
  }, [id, fetchPlaceById, location.hash, isAuthenticated]);

  const handleLike = async (isLike) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      await likePlace(place.id, isLike);
      // Refresh place data
      const updatedPlace = await fetchPlaceById(Number(id));
      setPlace(updatedPlace);
    } catch (err) {
      console.error("Failed to like place:", err);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      await favoritePlace(place.id);
      // Refresh place data
      const updatedPlace = await fetchPlaceById(Number(id));
      setPlace(updatedPlace);
    } catch (err) {
      console.error("Failed to favorite place:", err);
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
          onClick={() => navigate("/")}
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
              attribution="&copy; Esri"
            />
            <Marker position={[place.latitude, place.longitude]}>
              <Popup>{place.name}</Popup>
            </Marker>
          </MapContainer>

          <div className="top-0 right-0 left-0 absolute bg-gradient-to-b from-black/50 to-transparent p-4">
            <button
              className="bg-white hover:bg-gray-100 px-3 py-1 rounded-full text-gray-800 text-sm"
              onClick={() => navigate("/")}
            >
              &larr; Back to Map
            </button>
          </div>
        </div>

        {/* Place details */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{place.name}</h1>

              {/* User info and time */}
              <div className="flex items-center mt-1 text-gray-500 text-sm">
                <span>Added by {place.user_username || "Anonymous"}</span>
                <span className="mx-2">•</span>
                <span title={new Date(place.created_at).toLocaleString()}>
                  {new Date(place.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap items-center mt-2 mb-4 gap-1">
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
            </div>

            <div className="mt-4 md:mt-0 flex flex-col md:items-end gap-2">
              <PlaceActions
                place={place}
                onLike={() => handleLike(true)}
                onDislike={() => handleLike(false)}
                onFavorite={handleFavorite}
                isAuthenticated={isAuthenticated}
              />

              {/* Google Maps link */}
              <button
                className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps?q=${place.latitude},${place.longitude}`,
                    "_blank"
                  );
                }}
                title="Google Maps"
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
                    <filter id="b" width="280%" height="280%" x="-70%" y="-70%">
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
                    <stop offset="0" stopColor="#fff" stopOpacity="0.1"></stop>
                    <stop offset="1" stopColor="#fff" stopOpacity="0"></stop>
                  </radialGradient>
                  <path
                    fill="url(#r)"
                    d="M4300.322 0c-439.439 0-829.828 210.985-1075.081 537.54H403.155C181.42 537.54 0 718.96 0 940.695v4300.322c0 221.736 181.42 403.155 403.155 403.155h4300.322c221.735 0 403.155-181.419 403.155-403.155V2609.086c282.208-412.562 537.54-784.137 537.54-1265.235C5644.173 601.373 5042.8 0 4300.322 0"
                  ></path>
                </svg>
                <span className="text-xs text-gray-600 ml-1">
                  Google Maps
                </span>
              </button>
            </div>
          </div>

          <div className="mt-4 text-gray-700">
            <h2 className="mb-2 font-semibold text-xl">About this place</h2>
            <p className="whitespace-pre-line">{place.description}</p>
          </div>

          {/* Comments section */}
          <div
            id="comments"
            ref={commentsSectionRef}
            className="mt-8 pt-4 border-t"
          >
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
