import { useState, useEffect } from 'react';
import { mapService } from '../services/mapService';

export const useMapData = (mapId = null) => {
  const [maps, setMaps] = useState([]);
  const [levels, setLevels] = useState([]);
  const [mapInfo, setMapInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (mapId) {
          const mapData = await mapService.getMapWithLevels(mapId);
          setMapInfo(mapData);
          const mapLevels = mapService.extractLevelsFromMap(mapData);
          setLevels(mapLevels.map(level => ({ ...level, id: level.level_id, levelName: `${mapData.map_name} Level ${level.level_number}` })));
        } else {
          const fetchedMaps = await mapService.getAllMapsWithLevels();
          setMaps(fetchedMaps);
        }
      } catch (err) {
        setError(err.message);
        setMaps([]);
        setLevels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mapId]);

  return { maps, levels, mapInfo, loading, error };
};