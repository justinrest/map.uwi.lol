import React, { useEffect } from 'react';
import MapView from '../components/map/MapView';
import FeedSection from '../components/feed/FeedSection';
import { useMap } from '../hooks/useMap';

const HomePage = () => {
  const { initializeData, loading } = useMap();

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Main map area */}
      <div className="lg:w-3/4 h-[70vh] lg:h-[calc(100vh-64px)]">
        <MapView />
      </div>
      
      {/* Feed sidebar */}
      <div className="lg:w-1/4 p-4 bg-white shadow-md overflow-y-auto h-full lg:h-[calc(100vh-64px)]">
        <FeedSection />
      </div>
    </div>
  );
};

export default HomePage;