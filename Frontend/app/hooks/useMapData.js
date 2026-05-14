import { useState, useEffect, useCallback, useRef } from 'react';
import { mapService } from '../services/mapService';

export const useMapData = (mapId = null) => {
  const [maps, setMaps] = useState([]);
  const [levels, setLevels] = useState([]);
  const [mapInfo, setMapInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preloadProgress, setPreloadProgress] = useState({ loaded: 0, total: 0, progress: 0 });
  const lastMapsSignature = useRef('');

  const getMapsSignature = useCallback((mapList) => {
    if (!Array.isArray(mapList)) return '';
    return JSON.stringify(
      mapList.map((map) => ({
        map_id: map?.map_id,
        map_name: map?.map_name,
        is_active: map?.is_active,
        map_image: map?.map_image
      }))
    );
  }, []);

  const refetch = useCallback(async () => {  
    try {
      setLoading(true);
      setError(null);
      
      if (mapId) {
        console.log(`🔄 Fetching map data for mapId: ${mapId}`);
        const mapData = await mapService.getMapWithLevels(mapId);
        console.log('📊 Map data received in hook:', mapData);
        
        if (!mapData) {
          throw new Error('No map data returned from service');
        }
        
        setMapInfo(mapData);
        const mapLevels = mapService.extractLevelsFromMap(mapData);
        console.log('📋 Extracted levels in hook:', mapLevels);
        
        setLevels(mapLevels.map(level => ({ 
          ...level, 
          id: level.level_id, 
          levelName: `${mapData.map_name} Level ${level.level_number}` 
        })));

      } else {
        const fetchedMaps = await mapService.getAllMapsWithLevels();
        console.log('📊 Maps data received:', fetchedMaps);
        const nextSignature = getMapsSignature(fetchedMaps);
        if (nextSignature !== lastMapsSignature.current) {
          lastMapsSignature.current = nextSignature;
          setMaps(fetchedMaps);
        }
        
      }
    } catch (err) {
      console.error('❌ Error in useMapData:', err);
      setError(err.message);
      setMaps([]);
      setLevels([]);
      lastMapsSignature.current = '';
    } finally {
      setLoading(false);
    }
  }, [getMapsSignature, mapId]); 

  const refreshMapsIfChanged = useCallback(async () => {
    if (mapId) return;

    try {
      const fetchedMaps = await mapService.getAllMapsWithLevels();
      const nextSignature = getMapsSignature(fetchedMaps);
      if (nextSignature !== lastMapsSignature.current) {
        lastMapsSignature.current = nextSignature;
        setMaps(fetchedMaps);
      }
      setError(null);
    } catch (err) {
      console.error('❌ Error refreshing maps:', err);
      setError(err.message);
    }
  }, [getMapsSignature, mapId]);

  useEffect(() => {
    refetch();
  }, [refetch]);
  
  return { maps, levels, mapInfo, loading, error, refetch, refreshMapsIfChanged, preloadProgress };
};