// src/hooks/useLocations.js
import { useState, useEffect } from 'react';
import { fetchLocations, saveLocation } from './repositories/firebaseRepository';

export function useLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getData() {
      try {
        const data = await fetchLocations();
        setLocations(data);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    }
    getData();
  }, []);

  return { locations, loading, saveLocation };
}