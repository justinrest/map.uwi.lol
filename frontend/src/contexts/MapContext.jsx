import React, { createContext, useState, useCallback } from 'react';
import api from '../services/api';

export const MapContext = createContext();

export const MapProvider = ({ children }) => {
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newPlaces, setNewPlaces] = useState([]);
  const [topPlaces, setTopPlaces] = useState([]);

  const getUserPlaces = useCallback(async () => {
    try {
      const response = await api.get('/api/users/me/places');
      return response.data;
    } catch (err) {
      setError('Failed to fetch user places');
      console.error(err);
      throw err;
    }
  }, []);

  const updatePlace = useCallback(async (placeId, placeData) => {
    try {
      const response = await api.put(`/api/places/${placeId}`, placeData);

      // Update place in places array if it exists there
      setPlaces(prevPlaces =>
        prevPlaces.map(place =>
          place.id === placeId
            ? { ...place, ...response.data }
            : place
        )
      );

      return response.data;
    } catch (err) {
      setError('Failed to update place');
      console.error(err);
      throw err;
    }
  }, []);

  const deletePlace = useCallback(async (placeId) => {
    try {
      await api.delete(`/api/places/${placeId}`);

      // Remove place from places array
      setPlaces(prevPlaces => prevPlaces.filter(place => place.id !== placeId));

      return true;
    } catch (err) {
      setError('Failed to delete place');
      console.error(err);
      throw err;
    }
  }, []);

  const fetchPlaces = useCallback(async (categoryId = null) => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/places/';
      if (categoryId) {
        url += `?category_id=${categoryId}`;
      }

      const response = await api.get(url);
      setPlaces(response.data);

      return response.data;
    } catch (err) {
      setError('Failed to fetch places');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/categories/');
      setCategories(response.data);
      return response.data;
    } catch (err) {
      setError('Failed to fetch categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNewPlaces = useCallback(async () => {
    try {
      const response = await api.get('/api/feed/new');
      setNewPlaces(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch new places:', err);
    }
  }, []);

  const fetchTopPlaces = useCallback(async () => {
    try {
      const response = await api.get('/api/feed/top');
      setTopPlaces(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch top places:', err);
    }
  }, []);

  const fetchPlaceById = useCallback(async (placeId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/places/${placeId}`);
      return response.data;
    } catch (err) {
      setError(`Failed to fetch place with ID: ${placeId}`);
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addPlace = useCallback(async (placeData) => {
    try {
      setLoading(true);
      const response = await api.post('/api/places/', placeData);
      setPlaces(prevPlaces => [...prevPlaces, response.data]);
      await fetchNewPlaces(); // Refresh feed
      return response.data;
    } catch (err) {
      setError('Failed to add place');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchNewPlaces]);

  const likePlace = useCallback(async (placeId, isLike) => {
    try {
      await api.post(`/api/places/${placeId}/like`, { is_like: isLike });
      // Update the place in the local state
      setPlaces(prevPlaces =>
        prevPlaces.map(place =>
          place.id === placeId
            ? {
              ...place,
              like_count: isLike
                ? (place.like_count || 0) + 1
                : place.like_count,
              dislike_count: !isLike
                ? (place.dislike_count || 0) + 1
                : place.dislike_count
            }
            : place
        )
      );
      await fetchTopPlaces(); // Refresh top places
    } catch (err) {
      setError('Failed to like place');
      console.error(err);
    }
  }, [fetchTopPlaces]);

  const favoritePlace = useCallback(async (placeId) => {
    try {
      await api.post(`/api/places/${placeId}/favorite`);
      // Toggle favorite in local state
      setPlaces(prevPlaces =>
        prevPlaces.map(place =>
          place.id === placeId
            ? {
              ...place,
              favorite_count: (place.favorite_count || 0) + 1,
              is_favorited: true
            }
            : place
        )
      );
    } catch (err) {
      setError('Failed to favorite place');
      console.error(err);
    }
  }, []);

  const addComment = useCallback(async (placeId, content) => {
    try {
      const response = await api.post(`/api/places/${placeId}/comments/`, {
        content
      });
      return response.data;
    } catch (err) {
      setError('Failed to add comment');
      console.error(err);
      throw err;
    }
  }, []);

  const getUserFavorites = useCallback(async () => {
    try {
      const response = await api.get('/api/users/me/favorites');
      return response.data;
    } catch (err) {
      setError('Failed to fetch user favorites');
      console.error(err);
      throw err;
    }
  }, []);

  const initializeData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPlaces(),
        fetchCategories(),
        fetchNewPlaces(),
        fetchTopPlaces()
      ]);
    } catch (err) {
      setError('Failed to initialize data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchPlaces, fetchCategories, fetchNewPlaces, fetchTopPlaces]);

  // Make sure to include all functions in the context value
  const value = {
    places,
    categories,
    newPlaces,
    topPlaces,
    loading,
    error,
    fetchPlaces,
    fetchCategories,
    fetchPlaceById,
    addPlace,
    likePlace,
    favoritePlace,
    addComment,
    getUserFavorites,
    initializeData,
    fetchNewPlaces,
    fetchTopPlaces,
    getUserPlaces,   // Add these new functions
    updatePlace,     // to the value object
    deletePlace
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};