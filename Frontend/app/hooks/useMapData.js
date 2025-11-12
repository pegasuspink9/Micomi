import { useState, useEffect } from 'react';
import { mapService } from '../services/mapService';

export const useMapData = (mapId = null) => {
  const [maps, setMaps] = useState([]);
  const [levels, setLevels] = useState([]);
  const [mapInfo, setMapInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (mapId) {
        console.log(`🔄 Fetching map data for mapId: ${mapId}`); // Debug log
        const mapData = await mapService.getMapWithLevels(mapId);
        console.log('📊 Map data received in hook:', mapData); // Debug log
        
        if (!mapData) {
          throw new Error('No map data returned from service');
        }
        
        setMapInfo(mapData);
        const mapLevels = mapService.extractLevelsFromMap(mapData);
        console.log('📋 Extracted levels in hook:', mapLevels); // Debug log
        
        setLevels(mapLevels.map(level => ({ 
          ...level, 
          id: level.level_id, 
          levelName: `${mapData.map_name} Level ${level.level_number}` 
        })));
      } else {
        const fetchedMaps = await mapService.getAllMapsWithLevels();
        console.log('📊 Maps data received:', fetchedMaps);
        setMaps(fetchedMaps);
      }
    } catch (err) {
      console.error('❌ Error in useMapData:', err);
      setError(err.message);
      setMaps([]);
      setLevels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [mapId]);

  return { maps, levels, mapInfo, loading, error, refetch };
};